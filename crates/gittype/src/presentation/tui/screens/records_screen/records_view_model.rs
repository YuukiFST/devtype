use super::RecordsScreen;
use crate::domain::services::session_service::SessionDisplayData;
use chrono::{DateTime, Local};
use serde_json::{json, Value};

/// One list row, formatted like `format_session_line_ratatui_static`.
fn session_row_json(session_data: &SessionDisplayData) -> Value {
    let local_time: DateTime<Local> = session_data.session.started_at.into();
    let repository = session_data
        .repository
        .as_ref()
        .map(|repo| format!("{}/{}", repo.user_name, repo.repository_name))
        .unwrap_or_else(|| "Unknown".to_string());

    let result = session_data.session_result.as_ref();
    let or_dashes = |value: Option<String>| value.unwrap_or_else(|| "--".to_string());
    json!({
        "id": session_data.session.id,
        "date": local_time.format("%Y-%m-%d %H:%M").to_string(),
        "repository": repository,
        "score": or_dashes(result.map(|r| format!("{:.0}", r.score))),
        "cpm": or_dashes(result.map(|r| format!("{:.1}", r.cpm))),
        "accuracy": or_dashes(result.map(|r| format!("{:.1}%", r.accuracy))),
        "stages": or_dashes(result.map(|r| format!("{}/{}", r.stages_completed, r.stages_attempted))),
        "duration": or_dashes(result.map(|r| {
            format!("{}m{}s", r.duration_ms / 60000, (r.duration_ms % 60000) / 1000)
        })),
    })
}

impl RecordsScreen {
    pub(super) fn build_view_model(&self) -> Value {
        let filter_state = self.filter_state.read().unwrap();
        let sessions = self.sessions.read().unwrap();
        let list_state = self.list_state.read().unwrap();

        json!({
            "title": "Records - Typing Session Records",
            "filter": filter_state.date_filter.display_name(),
            "sort": filter_state.sort_by.display_name(),
            "sortDescending": filter_state.sort_descending,
            "sessionCount": sessions.len(),
            "sessions": sessions.iter().map(session_row_json).collect::<Vec<_>>(),
            "selectedIndex": list_state.selected(),
            "scrollOffset": list_state.offset(),
            "emptyMessage": [
                "No typing sessions found for the selected time period.",
                "Start typing to build your records!",
            ],
        })
    }
}
