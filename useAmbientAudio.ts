import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export interface SensorState {
  agitationLevel: "calm" | "moderate" | "agitated";
  agitationScore: number;
  lightLevel: "dark" | "dim" | "bright";
  luxValue: number;
  motionHz: number;
  isAvailable: boolean;
}

const DEFAULT: SensorState = {
  agitationLevel: "calm",
  agitationScore: 0,
  lightLevel: "dim",
  luxValue: 0,
  motionHz: 0,
  isAvailable: false,
};

export function useSensors(active = true): SensorState {
  const [state, setState] = useState<SensorState>(DEFAULT);
  const accelHistory = useRef<number[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ─── Web: DeviceMotion API (works on Android Chrome) ──────────────────────
  useEffect(() => {
    if (!active || Platform.OS !== "web") return;
    if (typeof window === "undefined") return;

    let gotData = false;

    const onMotion = (e: DeviceMotionEvent) => {
      gotData = true;
      const g = e.accelerationIncludingGravity;
      if (!g) return;
      const ax = g.x ?? 0;
      const ay = g.y ?? 0;
      const az = g.z ?? 0;
      // magnitude relative to gravity
      const raw = Math.sqrt(ax * ax + ay * ay + az * az);
      const delta = Math.abs(raw - 9.81) / 9.81;

      accelHistory.current = [...accelHistory.current.slice(-19), delta];
      const avg =
        accelHistory.current.reduce((a, b) => a + b, 0) /
        Math.max(1, accelHistory.current.length);

      const score = Math.min(1, avg * 6);
      const level: SensorState["agitationLevel"] =
        score < 0.15 ? "calm" : score < 0.45 ? "moderate" : "agitated";

      if (isMounted.current) {
        setState((prev) => ({
          ...prev,
          agitationScore: score,
          agitationLevel: level,
          motionHz: Math.round(raw * 10) / 10,
          isAvailable: true,
        }));
      }
    };

    window.addEventListener("devicemotion", onMotion);

    // Fallback after 1.5s — desktop / simulator shows calm state
    const fallback = setTimeout(() => {
      if (!gotData && isMounted.current) {
        setState({
          agitationLevel: "calm",
          agitationScore: 0.04,
          lightLevel: "dim",
          luxValue: 0,
          motionHz: 0,
          isAvailable: true,
        });
      }
    }, 1500);

    return () => {
      window.removeEventListener("devicemotion", onMotion);
      clearTimeout(fallback);
    };
  }, [active]);

  // ─── Native: expo-sensors Accelerometer + LightSensor ─────────────────────
  useEffect(() => {
    if (!active || Platform.OS === "web") return;

    let accelSub: { remove: () => void } | null = null;
    let lightSub: { remove: () => void } | null = null;

    async function setup() {
      try {
        const Sensors = await import("expo-sensors");

        Sensors.Accelerometer.setUpdateInterval(200);
        accelSub = Sensors.Accelerometer.addListener(({ x, y, z }) => {
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          const delta = Math.abs(magnitude - 1.0);

          accelHistory.current = [...accelHistory.current.slice(-19), delta];
          const avg =
            accelHistory.current.reduce((a, b) => a + b, 0) /
            accelHistory.current.length;

          const score = Math.min(1, avg * 5);
          const level: SensorState["agitationLevel"] =
            score < 0.15 ? "calm" : score < 0.45 ? "moderate" : "agitated";

          const crossings = accelHistory.current.reduce((acc, val, i, arr) => {
            if (i === 0) return acc;
            return acc + (arr[i - 1]! < 0.05 && val >= 0.05 ? 1 : 0);
          }, 0);
          const motionHz = (crossings / (accelHistory.current.length * 0.2)) * 0.5;

          if (isMounted.current) {
            setState((prev) => ({
              ...prev,
              agitationScore: score,
              agitationLevel: level,
              motionHz,
              isAvailable: true,
            }));
          }
        });

        if (Platform.OS === "android") {
          Sensors.LightSensor.setUpdateInterval(2000);
          lightSub = Sensors.LightSensor.addListener(({ illuminance }) => {
            const level: SensorState["lightLevel"] =
              illuminance < 50 ? "dark" : illuminance < 500 ? "dim" : "bright";
            if (isMounted.current) {
              setState((prev) => ({
                ...prev,
                luxValue: illuminance,
                lightLevel: level,
                isAvailable: true,
              }));
            }
          });
        }
      } catch (_) {}
    }

    setup();

    return () => {
      accelSub?.remove();
      lightSub?.remove();
    };
  }, [active]);

  return state;
}

export function getSessionRecommendation(
  sensors: SensorState,
  hour: number
): string {
  if (hour >= 22 || hour < 6)  return "nid";
  if (sensors.agitationLevel === "agitated") return "respiration";
  if (sensors.agitationLevel === "moderate") return "reboot";
  if (hour >= 6 && hour < 10)  return "etincelle";
  return "cristal";
}
