use super::{LoadingScreen, StepProgress};
use crate::domain::models::loading::StepType;
use crate::presentation::ui::view_model::git_repository_json;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::atomic::Ordering;

/// Same frames as `LoadingProgressView`.
const SPINNER_CHARS: &[char] = &['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

fn step_type_name(step_type: &StepType) -> String {
    format!("{:?}", step_type)
}

impl LoadingScreen {
    pub(super) fn build_view_model(&self) -> Value {
        let state = self.state.read().unwrap();
        let current_step = state
            .current_step
            .read()
            .map(|x| x.clone())
            .unwrap_or(StepType::Cloning);
        let spinner_index = state.spinner_index.load(Ordering::Relaxed);
        let spinner = SPINNER_CHARS[spinner_index % SPINNER_CHARS.len()];

        let steps = state
            .all_steps
            .read()
            .map(|s| s.clone())
            .unwrap_or_default();
        let current_number = steps
            .iter()
            .find(|s| s.step_type == current_step)
            .map(|s| s.step_number)
            .unwrap_or(0);
        let step_progress = state
            .step_progress
            .read()
            .map(|p| p.clone())
            .unwrap_or_default();

        let steps_json: Vec<Value> = steps
            .iter()
            .map(|step| {
                // Same rule as LoadingDescriptionView: a step is done once a
                // later-numbered step is current, or loading has completed.
                let status =
                    if current_step == StepType::Completed || step.step_number < current_number {
                        "done"
                    } else if step.step_type == current_step {
                        "current"
                    } else {
                        "pending"
                    };
                let progress = step_progress.get(&step.step_type).map(
                    |p| json!({ "processed": p.processed, "total": p.total, "ratio": p.progress }),
                );
                json!({
                    "type": step_type_name(&step.step_type),
                    "number": step.step_number,
                    "name": step.step_name,
                    "description": step.description,
                    "status": status,
                    "progress": progress,
                })
            })
            .collect();

        let repo_info = state
            .repo_info
            .read()
            .map(|r| r.clone())
            .unwrap_or_default();

        json!({
            "message": "Loading...",
            "description": "Analyzing your repository to create typing challenges...",
            "currentStep": step_type_name(&current_step),
            "steps": steps_json,
            "spinner": spinner.to_string(),
            "progress": progress_view_model(&current_step, &step_progress, spinner),
            "repoInfo": repo_info,
            "repository": git_repository_json(self.repository_store.get_repository().as_ref()),
            "failed": self.session_store.is_loading_failed(),
            "error": self.session_store.get_error_message(),
        })
    }
}

/// The progress line `LoadingProgressView` draws, or `null` when it draws none.
fn progress_view_model(
    current_step: &StepType,
    step_progress: &HashMap<StepType, StepProgress>,
    spinner: char,
) -> Value {
    if *current_step == StepType::Completed {
        return Value::Null;
    }
    let (progress, processed, total) = step_progress
        .get(current_step)
        .map(|p| (p.progress, p.processed, p.total))
        .unwrap_or((0.0, 0, 0));

    if total == 0
        && processed == 0
        && !matches!(
            current_step,
            StepType::Cloning | StepType::Scanning | StepType::Generating | StepType::Finalizing
        )
    {
        return Value::Null;
    }

    let unit = match current_step {
        StepType::Generating => "challenges",
        StepType::Cloning => "",
        _ => "files",
    };
    let text = if total == 0 {
        format!("{} Working...", spinner)
    } else if *current_step == StepType::Cloning {
        format!("{} {:.1}%", spinner, progress * 100.0)
    } else {
        format!(
            "{} {:.1}% {}/{} {}",
            spinner,
            progress * 100.0,
            processed,
            total,
            unit
        )
    };

    json!({
        "ratio": progress.clamp(0.0, 1.0),
        "processed": processed,
        "total": total,
        "unit": unit,
        "showBar": total > 0,
        "text": text,
    })
}
