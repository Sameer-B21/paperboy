import ActivityKit
import Foundation
import React

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {

    /// Currently-running Live Activity reference.
    private var currentActivity: Any? = nil

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    // MARK: - Start

    @objc
    func startActivity(
        _ title: String,
        status: String,
        progress: Double,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        if #available(iOS 16.2, *) {
            guard ActivityAuthorizationInfo().areActivitiesEnabled else {
                reject("LIVE_ACTIVITY_DISABLED", "Live Activities are disabled in Settings.", nil)
                return
            }

            let attributes = PaperboyActivityAttributes(title: title)
            let state = PaperboyActivityAttributes.ContentState(
                progress: progress,
                status: status,
                isPlaying: false
            )

            do {
                let activity = try Activity<PaperboyActivityAttributes>.request(
                    attributes: attributes,
                    content: .init(state: state, staleDate: nil),
                    pushType: nil
                )
                currentActivity = activity
                resolve(activity.id)
            } catch {
                reject("LIVE_ACTIVITY_START_FAILED", error.localizedDescription, error)
            }
        } else {
            reject("LIVE_ACTIVITY_UNSUPPORTED", "Live Activities require iOS 16.1+.", nil)
        }
    }

    // MARK: - Update

    @objc
    func updateActivity(
        _ status: String,
        progress: Double,
        isPlaying: Bool,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        if #available(iOS 16.2, *) {
            guard let activity = currentActivity as? Activity<PaperboyActivityAttributes> else {
                reject("LIVE_ACTIVITY_NOT_FOUND", "No active Live Activity to update.", nil)
                return
            }

            let updatedState = PaperboyActivityAttributes.ContentState(
                progress: progress,
                status: status,
                isPlaying: isPlaying
            )

            Task {
                await activity.update(
                    ActivityContent(state: updatedState, staleDate: nil)
                )
                resolve(nil)
            }
        } else {
            reject("LIVE_ACTIVITY_UNSUPPORTED", "Live Activities require iOS 16.1+.", nil)
        }
    }

    // MARK: - End

    @objc
    func endActivity(
        _ status: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        if #available(iOS 16.2, *) {
            guard let activity = currentActivity as? Activity<PaperboyActivityAttributes> else {
                reject("LIVE_ACTIVITY_NOT_FOUND", "No active Live Activity to end.", nil)
                return
            }

            let finalState = PaperboyActivityAttributes.ContentState(
                progress: 1.0,
                status: status,
                isPlaying: false
            )

            Task {
                await activity.end(
                    ActivityContent(state: finalState, staleDate: nil),
                    dismissalPolicy: .default
                )
                currentActivity = nil
                resolve(nil)
            }
        } else {
            reject("LIVE_ACTIVITY_UNSUPPORTED", "Live Activities require iOS 16.1+.", nil)
        }
    }
}
