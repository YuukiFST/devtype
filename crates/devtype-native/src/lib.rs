//! Node-API bridge: runs gittype's screen manager headless and hands the
//! GUI one JSON snapshot per frame.

mod cli;
mod failure;
mod game;
mod keys;
mod startup;

pub use cli::run_cli;
pub use failure::take_failure;
pub use game::GameEngine;
pub use startup::{check_for_update, load_palette};
