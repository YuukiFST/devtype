//! Node-API bridge: runs gittype's screen manager headless and hands the
//! GUI one JSON snapshot per frame.

mod game;
mod keys;

pub use game::GameEngine;
