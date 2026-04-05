import type { VisionCamera } from "@/features/cba/types/vision";

export type VisionCameraSourceMeta = {
  sourceLabel: string;
  sourceHint: string;
  statusLabel: string;
  statusTone: "emerald" | "amber" | "sky";
  modeLabel: string;
};

function getCameraLetter(camera: VisionCamera | null) {
  if (!camera) {
    return "";
  }

  const match = camera.name.match(/camera\s+([a-z])/i);

  if (match?.[1]) {
    return match[1].toUpperCase();
  }

  const fallback = camera.streamId || camera.shelfGroup;
  return fallback.trim().charAt(0).toUpperCase();
}

export function getVisionCameraSourceMeta(
  camera: VisionCamera | null,
): VisionCameraSourceMeta {
  const letter = getCameraLetter(camera);
  const isActive = camera?.isActive ?? false;

  if (letter === "A" || letter === "B" || letter === "C" || letter === "E") {
    return {
      sourceLabel: "Mock Video",
      sourceHint: "Simulated playback for demos and UI validation.",
      statusLabel: isActive ? "Simulated Active" : "Simulated Standby",
      statusTone: "sky",
      modeLabel: "Simulated Feed",
    };
  }

  if (letter === "D") {
    return {
      sourceLabel: "Webcam",
      sourceHint: "Direct webcam source from the active shelf zone.",
      statusLabel: isActive ? "Webcam Live" : "Webcam Standby",
      statusTone: isActive ? "emerald" : "amber",
      modeLabel: "Webcam Feed",
    };
  }

  if (letter === "F") {
    return {
      sourceLabel: "IoT ESP32-CAM",
      sourceHint: "Edge-connected ESP32-CAM feed for lightweight live capture.",
      statusLabel: isActive ? "IoT Online" : "IoT Offline",
      statusTone: isActive ? "emerald" : "amber",
      modeLabel: "IoT Feed",
    };
  }

  return {
    sourceLabel: isActive ? "Live Camera" : "Simulated Feed",
    sourceHint: "Camera source type inferred from the current backend metadata.",
    statusLabel: isActive ? "Available" : "Standby",
    statusTone: isActive ? "emerald" : "amber",
    modeLabel: isActive ? "Live Feed" : "Standby Feed",
  };
}
