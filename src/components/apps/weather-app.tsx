import { useEffect, useState } from "react";

type Current = { temperature_2m: number; weather_code: number; wind_speed_10m: number };
type Daily = { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[] };

const CODE: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  51: "Drizzle",
  61: "Rain",
  71: "Snow",
  80: "Showers",
  95: "Thunder",
};

export function WeatherApp() {
  const [place, setPlace] = useState("Orlando");
  const [current, setCurrent] = useState<Current | null>(null);
  const [daily, setDaily] = useState<Daily | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let lat = 28.5383;
    let lon = -81.3792;
    const load = (la: number, lo: number, label: string) => {
      setPlace(label);
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
      )
        .then((r) => r.json())
        .then((data: { current?: Current; daily?: Daily }) => {
          if (data.current) setCurrent(data.current);
          if (data.daily) setDaily(data.daily);
        })
        .catch(() => setErr("Could not load forecast"));
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude, "Here"),
        () => load(lat, lon, "Orlando"),
        { timeout: 4000 },
      );
    } else {
      load(lat, lon, "Orlando");
    }
  }, []);

  return (
    <div className="h-full overflow-auto bg-bg p-5">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">{place}</p>
      {err ? <p className="mt-4 text-sm text-danger">{err}</p> : null}
      {current ? (
        <>
          <p className="mt-2 text-5xl font-semibold tabular-nums">{Math.round(current.temperature_2m)}°</p>
          <p className="mt-1 text-sm text-muted">
            {CODE[current.weather_code] ?? "Conditions"} · wind {Math.round(current.wind_speed_10m)} km/h
          </p>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted">Fetching forecast…</p>
      )}
      {daily ? (
        <ul className="mt-6 space-y-2">
          {daily.time.slice(0, 7).map((day, i) => (
            <li key={day} className="flex items-center justify-between rounded-md bg-surface px-3 py-2 text-sm">
              <span>
                {new Date(day + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" })} ·{" "}
                {CODE[daily.weather_code[i] ?? 0] ?? ""}
              </span>
              <span className="tabular-nums text-muted">
                {Math.round(daily.temperature_2m_min[i] ?? 0)}° / {Math.round(daily.temperature_2m_max[i] ?? 0)}°
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
