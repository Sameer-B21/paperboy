import ActivityKit
import Foundation

struct PaperboyActivityAttributes: ActivityAttributes {
    /// Static data set once when the Live Activity starts.
    public struct ContentState: Codable, Hashable {
        /// Progress value between 0.0 and 1.0.
        var progress: Double
        /// Human-readable status, e.g. "Generating Summary..."
        var status: String
        /// Whether audio is currently playing.
        var isPlaying: Bool
        /// Duration of the podcast in minutes
        var durationMinutes: Int
    }

    /// Title shown in the Live Activity (e.g. "Tech News Brief").
    var title: String
    /// User name for the greeting.
    var userName: String
}
