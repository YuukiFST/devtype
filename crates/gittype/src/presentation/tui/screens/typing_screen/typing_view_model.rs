use super::TypingScreen;
use crate::domain::models::Languages;
use crate::domain::services::scoring::RealTimeCalculator;
use crate::domain::services::typing_core::TypingCore;
use crate::domain::services::SessionManager;
use serde_json::{json, Value};

/// Lines of the challenge sent to the host on each side of the cursor line;
/// Zen challenges are whole files, so the full text would be thousands of rows.
const VIEW_MODEL_LINE_WINDOW: usize = 60;

#[derive(Clone, Copy, PartialEq)]
enum CodeRunKind {
    Typed,
    Cursor,
    Mistake,
    Untyped,
    Comment,
}

impl CodeRunKind {
    fn as_str(self) -> &'static str {
        match self {
            CodeRunKind::Typed => "typed",
            CodeRunKind::Cursor => "cursor",
            CodeRunKind::Mistake => "mistake",
            CodeRunKind::Untyped => "untyped",
            CodeRunKind::Comment => "comment",
        }
    }
}

type CodeLine = Vec<(CodeRunKind, String)>;

impl TypingScreen {
    /// Same character classification as `TypingContentView`, grouped into
    /// runs of equal kind per source line. A cursor sitting on a newline is
    /// kept as a one-space run so the host can draw it at the line end.
    fn code_lines_view_model(&self, core: &TypingCore) -> Vec<CodeLine> {
        let cursor = core.current_position_to_display();
        let mistake = core.current_mistake_position();
        let comment_ranges = core.display_comment_ranges();

        let mut lines: Vec<CodeLine> = vec![Vec::new()];
        let mut byte_position = 0;
        for (index, ch) in core.text_to_display().chars().enumerate() {
            let in_comment = comment_ranges
                .iter()
                .any(|(start, end)| byte_position >= *start && byte_position < *end);
            byte_position += ch.len_utf8();
            let kind = if in_comment {
                CodeRunKind::Comment
            } else if index < cursor {
                CodeRunKind::Typed
            } else if index == cursor && mistake == Some(index) {
                CodeRunKind::Mistake
            } else if index == cursor {
                CodeRunKind::Cursor
            } else {
                CodeRunKind::Untyped
            };

            let text = match ch {
                '\n' if index == cursor => " ".to_string(),
                '\n' => {
                    lines.push(Vec::new());
                    continue;
                }
                '\t' => "    ".to_string(),
                c if c.is_control() => "?".to_string(),
                c => c.to_string(),
            };
            let line = lines.last_mut().expect("lines starts non-empty");
            match line.last_mut() {
                Some((last_kind, run)) if *last_kind == kind => run.push_str(&text),
                _ => line.push((kind, text)),
            }
            if ch == '\n' {
                lines.push(Vec::new());
            }
        }
        lines
    }
}

fn code_line_json(runs: &CodeLine) -> Value {
    Value::Array(
        runs.iter()
            .map(|(kind, text)| json!({ "kind": kind.as_str(), "text": text }))
            .collect(),
    )
}

impl TypingScreen {
    pub(super) fn build_view_model(&self) -> Value {
        let core = self.typing_core.read().unwrap();
        let challenge = self.challenge.read().unwrap();
        let git_repository = self.git_repository.read().unwrap();
        let context = self.code_context.read().unwrap();
        let waiting_to_start = *self.waiting_to_start.read().unwrap();
        let countdown = self.countdown.read().unwrap().get_current_count();
        let session_manager = self
            .session_manager
            .as_any()
            .downcast_ref::<SessionManager>();
        let skips_remaining = session_manager
            .and_then(|sm| sm.get_skips_remaining().ok())
            .unwrap_or(0);

        let state = if waiting_to_start {
            "waiting"
        } else if countdown.is_some() {
            "countdown"
        } else {
            "typing"
        };

        let header = challenge.as_ref().map(|c| {
            json!({
                "title": c.get_display_title_with_repo(&git_repository.clone()),
                "language": c.language.as_ref().map(|l| Languages::get_display_name(Some(l))),
                "difficulty": c
                    .difficulty_level
                    .as_ref()
                    .map(|d| format!("{:?}", d))
                    .unwrap_or_else(|| "Unknown".to_string()),
            })
        });

        let tracker = session_manager.and_then(|sm| sm.get_current_stage_tracker());
        let metrics = match tracker {
            Some(tracker) if state == "typing" => {
                let data = tracker.get_data();
                let realtime = RealTimeCalculator::calculate(
                    core.current_position_to_type(),
                    core.mistakes(),
                    data.elapsed_time,
                );
                json!({
                    "wpm": realtime.wpm.round(),
                    "cpm": realtime.cpm.round(),
                    "accuracy": realtime.accuracy.round(),
                    "mistakes": realtime.mistakes,
                    "streak": data.current_streak,
                    "timeSecs": data.elapsed_time.as_secs(),
                    "skipsRemaining": skips_remaining,
                })
            }
            _ => json!({
                "wpm": 0, "cpm": 0, "accuracy": 0, "mistakes": 0, "streak": 0,
                "timeSecs": 0, "skipsRemaining": skips_remaining,
            }),
        };

        let display_len = core.text_to_display().chars().count();
        let progress = if state != "typing" || display_len == 0 {
            0
        } else {
            (core.current_position_to_display() as f32 / display_len as f32 * 100.0) as u8
        };

        let lines = self.code_lines_view_model(&core);
        let current_line = core.current_line_to_display();
        let first = current_line.saturating_sub(VIEW_MODEL_LINE_WINDOW);
        let last = (current_line + VIEW_MODEL_LINE_WINDOW + 1).min(lines.len());
        let start_line = challenge.as_ref().and_then(|c| c.start_line).unwrap_or(1);
        let end_line = challenge
            .as_ref()
            .and_then(|c| c.end_line)
            .unwrap_or(start_line);
        let pre_len = context.pre_context.len();
        let pre_context: Vec<Value> = context
            .pre_context
            .iter()
            .enumerate()
            .map(|(i, text)| {
                json!({ "number": start_line.saturating_sub(pre_len - i), "text": text.replace('\t', "    ") })
            })
            .collect();
        let post_context: Vec<Value> = context
            .post_context
            .iter()
            .enumerate()
            .map(|(i, text)| json!({ "number": end_line + i + 1, "text": text.replace('\t', "    ") }))
            .collect();

        json!({
            "state": state,
            "countdown": countdown,
            "dialogShown": *self.dialog_shown.read().unwrap(),
            "header": header,
            "metrics": metrics,
            "progress": progress,
            "code": {
                "startLine": start_line,
                "firstLineIndex": first,
                "totalLines": lines.len(),
                "currentLine": current_line,
                "lines": lines[first..last].iter().map(code_line_json).collect::<Vec<_>>(),
                "preContext": if first == 0 { pre_context } else { Vec::new() },
                "postContext": if last == lines.len() { post_context } else { Vec::new() },
            },
        })
    }
}
