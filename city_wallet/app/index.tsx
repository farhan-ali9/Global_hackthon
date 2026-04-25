import { Link, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getOnDeviceLlamaModelManager,
  type LocalRankingPipelineResult,
  type OnDeviceModelStatus,
} from "@/src/ai/onDeviceLlamaPipeline";
import { generateOffer, getMerchantCandidates } from "@/src/lib/api";
import { setLatestOffer } from "@/src/lib/demoState";
import type {
  GeneratedOfferResponse,
  MerchantCandidate,
} from "@/src/types/city-wallet";

const defaultCityId =
  process.env.EXPO_PUBLIC_DEFAULT_CITY_ID ?? "stuttgart-demo";

const modelManager = getOnDeviceLlamaModelManager();

export default function Index() {
  const [modelStatus, setModelStatus] = useState<OnDeviceModelStatus>(
    modelManager.modelStatus,
  );
  const [cityId, setCityId] = useState(defaultCityId);
  const [zoneId, setZoneId] = useState("");
  const [localSignalSummary, setLocalSignalSummary] = useState("");
  const [candidates, setCandidates] = useState<MerchantCandidate[]>([]);
  const [ranking, setRanking] = useState<LocalRankingPipelineResult | null>(null);
  const [offer, setOffer] = useState<GeneratedOfferResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    void refreshModelStatus();
  }, []);

  async function refreshModelStatus() {
    setModelStatus(await modelManager.refreshStatus());
  }

  async function runAction(actionName: string, action: () => Promise<void>) {
    setBusyAction(actionName);
    setError(null);

    try {
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action failed");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDownloadModel() {
    await runAction("download", async () => {
      const status = await modelManager.downloadModel(setModelStatus);
      setModelStatus(status);
    });
  }

  async function handlePrepareModel() {
    await runAction("prepare", async () => {
      setModelStatus(await modelManager.prepareModel());
    });
  }

  async function handleUnloadModel() {
    await runAction("unload", async () => {
      setModelStatus(await modelManager.unloadModel());
    });
  }

  async function handleLoadCandidates() {
    await runAction("load-candidates", async () => {
      const response = await getMerchantCandidates(cityId.trim());
      setCandidates(response.candidates);
      setRanking(null);
      setOffer(null);
    });
  }

  async function handleRunLocalRanking() {
    await runAction("rank", async () => {
      if (!cityId.trim()) {
        throw new Error("Set a city id before running ranking.");
      }

      if (!localSignalSummary.trim()) {
        throw new Error("Connect or enter local signals before running ranking.");
      }

      const result = await modelManager.rankMerchantCandidates({
        localSignals: {
          cityId: cityId.trim(),
          zoneId: zoneId.trim() || undefined,
          localSignalSummary: localSignalSummary.trim(),
          capturedAt: new Date().toISOString(),
        },
        candidates,
      });
      setRanking(result);
      setOffer(null);
    });
  }

  async function handleGenerateOffer() {
    await runAction("generate-offer", async () => {
      if (!ranking) {
        throw new Error("Run local ranking before generating an offer.");
      }

      const generatedOffer = await generateOffer(ranking.selectedOfferRequest);
      setLatestOffer(generatedOffer);
      setOffer(generatedOffer);
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>City Wallet</Text>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Model</Text>
        <Text selectable style={styles.code}>
          {JSON.stringify(modelStatus, null, 2)}
        </Text>
        <View style={styles.buttonRow}>
          <Button title="Refresh" onPress={refreshModelStatus} />
          <Button
            title={busyAction === "download" ? "Downloading..." : "Download"}
            onPress={handleDownloadModel}
            disabled={busyAction !== null}
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            title={busyAction === "prepare" ? "Preparing..." : "Prepare"}
            onPress={handlePrepareModel}
            disabled={busyAction !== null || !modelStatus.isDownloaded}
          />
          <Button
            title="Unload"
            onPress={handleUnloadModel}
            disabled={busyAction !== null || !modelStatus.isPrepared}
          />
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Local inputs</Text>
        <TextInput
          value={cityId}
          onChangeText={setCityId}
          autoCapitalize="none"
          style={styles.input}
          placeholder="stuttgart-demo"
        />
        <TextInput
          value={zoneId}
          onChangeText={setZoneId}
          autoCapitalize="none"
          style={styles.input}
          placeholder="old-town"
        />
        <TextInput
          value={localSignalSummary}
          onChangeText={setLocalSignalSummary}
          multiline
          style={[styles.input, styles.multilineInput]}
          placeholder="It is lunch, cold outside, I am walking near old-town, browsing shops, and would prefer a warm quiet cafe nearby."
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Merchant candidates</Text>
        <Button
          title={
            busyAction === "load-candidates"
              ? "Loading..."
              : "Load candidates"
          }
          onPress={handleLoadCandidates}
          disabled={busyAction !== null || !cityId.trim()}
        />
        <Text selectable style={styles.code}>
          {candidates.length > 0
            ? JSON.stringify(candidates, null, 2)
            : "No candidates loaded"}
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Local ranking</Text>
        <Button
          title={busyAction === "rank" ? "Ranking..." : "Run local ranking"}
          onPress={handleRunLocalRanking}
          disabled={
            busyAction !== null ||
            !modelStatus.isPrepared ||
            candidates.length === 0
          }
        />
        <Text selectable style={styles.code}>
          {ranking ? JSON.stringify(ranking, null, 2) : "No ranking yet"}
        </Text>
      </View>

      <Button
        title={
          busyAction === "generate-offer"
            ? "Generating..."
            : "Generate selected offer"
        }
        onPress={handleGenerateOffer}
        disabled={busyAction !== null || !ranking}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {offer ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Returned offer</Text>
          <Text style={styles.body}>
            {offer.ui.headline} · {offer.offer.discountPercent}% off at{" "}
            {offer.offer.merchant.name}
          </Text>
          <Text selectable style={styles.code}>
            {JSON.stringify(offer.ui, null, 2)}
          </Text>
          <Link href={`/offers/${offer.offer.id}` as Href} style={styles.link}>
            Open offer
          </Link>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  panel: {
    gap: 8,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderColor: "#DDDDDD",
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    borderColor: "#CFCFCF",
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  multilineInput: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  code: {
    fontFamily: "Courier",
    fontSize: 12,
    lineHeight: 17,
  },
  error: {
    color: "#B00020",
  },
  link: {
    color: "#0057CC",
    fontSize: 15,
    fontWeight: "700",
  },
});
