use super::{AnalyticsScreen, ViewMode};
use crate::domain::models::Languages;
use crate::domain::services::analytics_service::AnalyticsData;
use chrono::{Datelike, Duration, Local};
use serde_json::{json, Value};

/// Longest activity window the TUI bar chart can show; the GUI picks how many fit.
const MAX_ACTIVITY_DAYS: usize = 90;

fn metric(label: &str, value: String, tone: &str) -> Value {
    json!({ "label": label, "value": value, "tone": tone })
}

/// Detail sections shared by RepoStats and LangStats, which have identical fields.
macro_rules! stats_sections {
    ($stats:expr) => {{
        let stats = $stats;
        json!([
            {
                "title": "Speed Metrics",
                "items": [
                    metric("Average CPM", format!("{:.1}", stats.avg_cpm), "cpmWpm"),
                    metric("Average WPM", format!("{:.1}", stats.avg_wpm), "cpmWpm"),
                    metric("Best CPM", format!("{:.1}", stats.best_cpm), "cpmWpm"),
                ],
            },
            {
                "title": "Accuracy & Quality",
                "items": [
                    metric("Average Accuracy", format!("{:.1}%", stats.avg_accuracy), "accuracy"),
                    metric("Best Accuracy", format!("{:.1}%", stats.best_accuracy), "accuracy"),
                    metric("Total Mistakes", format!("{}", stats.total_mistakes), "error"),
                ],
            },
            {
                "title": "Volume & Activity",
                "items": [
                    metric("Total Sessions", format!("{}", stats.total_sessions), "stageInfo"),
                    metric("Total Keystrokes", format!("{}", stats.total_keystrokes), "stageInfo"),
                    metric(
                        "Total Time",
                        format!(
                            "{}h {}m",
                            stats.total_duration_ms / 3600000,
                            (stats.total_duration_ms % 3600000) / 60000
                        ),
                        "duration",
                    ),
                ],
            },
            {
                "title": "Progress",
                "items": [
                    metric("Average Score", format!("{:.0}", stats.avg_score), "score"),
                    metric(
                        "Total Stages",
                        format!("{}/{} completed", stats.stages_completed, stats.stages_attempted),
                        "stageInfo",
                    ),
                ],
            },
        ])
    }};
}

/// Line chart data, with the same bounds and axis labels as `TrendsView`.
fn trend_json(series: &[(String, f64)], percent_labels: bool) -> Value {
    let max = series.iter().map(|(_, value)| *value).fold(0.0, f64::max);
    let min = series.iter().map(|(_, value)| *value).fold(max, f64::min);
    let range = (max - min).max(10.0);
    let label = |value: f64| {
        if percent_labels {
            format!("{:.1}%", value)
        } else {
            format!("{:.0}", value)
        }
    };
    let x_labels: Vec<&str> = series
        .iter()
        .step_by((series.len().max(1) / 8).max(1))
        .map(|(date, _)| {
            if date.len() >= 5 {
                &date[3..]
            } else {
                date.as_str()
            }
        })
        .collect();

    json!({
        "points": series
            .iter()
            .map(|(date, value)| json!({ "date": date, "value": value }))
            .collect::<Vec<_>>(),
        "min": min,
        "max": max,
        "yBounds": [min - range * 0.1, max + range * 0.1],
        "yLabels": [label(min), label((min + max) / 2.0), label(max)],
        "xLabels": x_labels,
    })
}

fn overview_json(data: &AnalyticsData) -> Value {
    let today = data
        .reference_date
        .unwrap_or_else(|| Local::now().date_naive());
    let activity: Vec<Value> = (0..MAX_ACTIVITY_DAYS)
        .rev()
        .map(|i| {
            let date = today - Duration::days(i as i64);
            let key = format!("{:02}-{:02}", date.month(), date.day());
            let count = data.daily_sessions.get(&key).copied().unwrap_or(0);
            json!({ "key": key, "label": format!("{:02}", date.day()), "count": count })
        })
        .collect();

    json!({
        "stats": [
            metric("Sessions", format!("{}", data.total_sessions), "stageInfo"),
            metric("Avg CPM", format!("{:.1}", data.avg_cpm), "cpmWpm"),
            metric("Best CPM", format!("{:.1}", data.best_cpm), "cpmWpm"),
            metric("Avg Accuracy", format!("{:.1}%", data.avg_accuracy), "accuracy"),
            metric("Total Time", format!("{:.1}h", data.total_time_hours), "duration"),
            metric("Avg Session", format!("{:.1}m", data.avg_session_duration), "duration"),
            metric("Total Mistakes", format!("{}", data.total_mistakes), "error"),
            metric("Repositories", format!("{}", data.top_repositories.len()), "keyAction"),
        ],
        "activity": {
            "hasData": !data.daily_sessions.is_empty(),
            "days": activity,
            "totalSessions": data.daily_sessions.values().sum::<usize>(),
            "maxPerDay": data.daily_sessions.values().max().copied().unwrap_or(0),
            "emptyMessage": "No recent activity - start typing to see your activity chart!",
        },
        "topRepositories": data
            .top_repositories
            .iter()
            .map(|(name, cpm)| json!({ "name": name, "cpm": format!("{:.1} CPM", cpm) }))
            .collect::<Vec<_>>(),
        "topLanguages": data
            .top_languages
            .iter()
            .map(|(name, cpm, _)| {
                json!({
                    "name": Languages::get_display_name(Some(name)),
                    "cpm": format!("{:.1} CPM", cpm),
                })
            })
            .collect::<Vec<_>>(),
    })
}

fn repositories_json(data: &AnalyticsData, selected: Option<usize>) -> Value {
    let detail = match (selected, data.top_repositories.get(selected.unwrap_or(0))) {
        (Some(_), Some((name, cpm))) => match data.repository_stats.get(name) {
            Some(stats) => json!({ "name": name, "sections": stats_sections!(stats) }),
            None => json!({
                "name": name,
                "fallback": [
                    metric("Average CPM", format!("{:.1}", cpm), "cpmWpm"),
                    metric("WPM Equivalent", format!("{:.1}", cpm / 5.0), "cpmWpm"),
                ],
            }),
        },
        _ => Value::Null,
    };

    json!({
        "items": data
            .top_repositories
            .iter()
            .map(|(name, cpm)| json!({ "name": name, "cpm": format!("{:.1} CPM", cpm) }))
            .collect::<Vec<_>>(),
        "selectedIndex": selected,
        "detail": detail,
    })
}

fn languages_json(data: &AnalyticsData, selected: Option<usize>) -> Value {
    let detail = match (selected, data.top_languages.get(selected.unwrap_or(0))) {
        (Some(_), Some((name, cpm, sessions))) => {
            let display_name = Languages::get_display_name(Some(name));
            match data.language_stats.get(name) {
                Some(stats) => json!({ "name": display_name, "sections": stats_sections!(stats) }),
                None => json!({
                    "name": display_name,
                    "fallback": [
                        metric("Average CPM", format!("{:.1}", cpm), "cpmWpm"),
                        metric("WPM Equivalent", format!("{:.1}", cpm / 5.0), "cpmWpm"),
                        metric("Session Count", format!("{}", sessions), "stageInfo"),
                    ],
                }),
            }
        }
        _ => Value::Null,
    };

    json!({
        "items": data
            .top_languages
            .iter()
            .map(|(name, cpm, sessions)| {
                json!({
                    "name": Languages::get_display_name(Some(name)),
                    "cpm": format!("{:.1} CPM ({:2})", cpm, sessions),
                })
            })
            .collect::<Vec<_>>(),
        "selectedIndex": selected,
        "detail": detail,
    })
}

impl AnalyticsScreen {
    pub(super) fn build_view_model(&self) -> Value {
        let view_mode = *self.view_mode.read().unwrap();
        let data = self.data.read().unwrap();
        let tabs: Vec<Value> = [
            ViewMode::Overview,
            ViewMode::Trends,
            ViewMode::Repositories,
            ViewMode::Languages,
        ]
        .iter()
        .map(|mode| json!({ "name": mode.display_name(), "active": *mode == view_mode }))
        .collect();

        let content = data.as_ref().map(|data| {
            json!({
                "overview": overview_json(data),
                "trends": {
                    "cpm": trend_json(&data.cpm_trend, false),
                    "accuracy": trend_json(&data.accuracy_trend, true),
                    "cpmEmptyMessage":
                        "No trend data available - keep typing to build your performance history!",
                    "accuracyEmptyMessage":
                        "No accuracy trend data available - keep typing to build your accuracy history!",
                },
                "repositories": repositories_json(
                    data,
                    self.repository_list_state.read().unwrap().selected(),
                ),
                "languages": languages_json(
                    data,
                    self.language_list_state.read().unwrap().selected(),
                ),
                "currentStreak": data.current_streak,
            })
        });

        json!({
            "title": "Performance Analytics",
            "viewMode": view_mode.display_name(),
            "tabs": tabs,
            "loadingMessage": "Loading analytics data...",
            "data": content,
        })
    }
}
