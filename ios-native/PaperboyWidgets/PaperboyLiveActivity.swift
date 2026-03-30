import ActivityKit
import SwiftUI
import WidgetKit

struct PaperboyLiveActivity: Widget {
    private static let toggleURL = URL(string: "newsletterpodcaster:///today?action=toggle-playback")!

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PaperboyActivityAttributes.self) { context in
            // ── Lock Screen / StandBy banner ──
            lockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // ── Expanded Region ──
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "newspaper.fill")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(Int(context.state.progress * 100))%")
                        .font(.headline.monospacedDigit())
                        .foregroundColor(.secondary)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 6) {
                        Text(context.attributes.title)
                            .font(.headline)
                            .lineLimit(1)
                        Text(context.state.status)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 8) {
                        ProgressView(value: context.state.progress)
                            .tint(.blue)
                            .padding(.horizontal, 4)
                        // Play/Pause button
                        Link(destination: Self.toggleURL) {
                            Image(systemName: context.state.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                                .font(.system(size: 32))
                                .foregroundColor(.blue)
                        }
                    }
                }
            } compactLeading: {
                // ── Compact Leading ──
                Link(destination: Self.toggleURL) {
                    Image(systemName: context.state.isPlaying ? "pause.fill" : "play.fill")
                        .foregroundColor(.blue)
                        .font(.callout)
                }
            } compactTrailing: {
                // ── Compact Trailing ──
                Text("\(Int(context.state.progress * 100))%")
                    .font(.caption.monospacedDigit())
                    .foregroundColor(.secondary)
            } minimal: {
                // ── Minimal (when another app also has a Live Activity) ──
                Image(systemName: context.state.isPlaying ? "pause.fill" : "play.fill")
                    .foregroundColor(.blue)
                    .font(.caption2)
            }
        }
    }

    // MARK: - Lock Screen Banner

    @ViewBuilder
    private func lockScreenView(context: ActivityViewContext<PaperboyActivityAttributes>) -> some View {
        let greeting = "Good morning, \(context.attributes.userName)."
        let durationText = context.state.durationMinutes > 0 ? " • \(context.state.durationMinutes) minutes" : ""
        let isReady = context.state.progress >= 1.0
        let statusText = isReady ? "Your paper is ready\(durationText)" : context.state.status

        Link(destination: Self.toggleURL) {
            HStack(alignment: .center, spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(greeting)
                        .font(.custom("Palatino", size: 24)) // Serif-like font
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .lineLimit(1)
                    
                    Text(statusText)
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.9))
                        .lineLimit(1)
                    
                    if !isReady {
                        ProgressView(value: context.state.progress)
                            .tint(.white)
                            .padding(.top, 4)
                    }
                }
                
                Spacer(minLength: 0)
                
                ZStack {
                    if isReady {
                        Image(systemName: "newspaper")
                            .font(.system(size: 40, weight: .light))
                            .foregroundColor(.white)
                    } else {
                        Image(systemName: context.state.isPlaying ? "pause.circle" : "play.circle")
                            .font(.system(size: 40, weight: .light))
                            .foregroundColor(.white)
                    }
                }
            }
            .padding(20)
            .background(
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 0.45, green: 0.35, blue: 0.35).opacity(0.6),
                        Color(red: 0.25, green: 0.20, blue: 0.25).opacity(0.6)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
        }
        .activityBackgroundTint(Color.clear)
        .activitySystemActionForegroundColor(.white)
    }
}
