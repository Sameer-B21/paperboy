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
        HStack(spacing: 14) {
            // Icon
            ZStack {
                Circle()
                    .fill(Color.blue.opacity(0.15))
                    .frame(width: 44, height: 44)
                Image(systemName: "newspaper.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.blue)
            }

            // Text + progress
            VStack(alignment: .leading, spacing: 4) {
                Text(context.attributes.title)
                    .font(.headline)
                    .lineLimit(1)
                Text(context.state.status)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                ProgressView(value: context.state.progress)
                    .tint(.blue)
            }

            Spacer(minLength: 0)

            // Play/Pause button
            Link(destination: Self.toggleURL) {
                ZStack {
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 44, height: 44)
                    Image(systemName: context.state.isPlaying ? "pause.fill" : "play.fill")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                }
            }
        }
        .padding(16)
        .activityBackgroundTint(.black.opacity(0.75))
        .activitySystemActionForegroundColor(.white)
    }
}
