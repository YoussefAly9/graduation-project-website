import { useEffect, useState } from 'react';

import { ROBOT_PIPELINE, fetchRobotStatus, subscribeToRobot } from '@/services/robotService.js';

/**
 * RobotTracker
 * Live view of the robot's execution for a single order.
 * Uses Socket.IO when available (VITE_SOCKET_URL), otherwise polls /robot/status.
 */
const FAILURE_STATES = ['failed', 'rejected', 'cancelled'];

const stateIndex = (state) => ROBOT_PIPELINE.findIndex((s) => s.state === state);

const RobotTracker = ({ orderId }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return undefined;

    let active = true;
    fetchRobotStatus({ orderId })
      .then((snapshot) => {
        if (active) setTask(snapshot?.task || null);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));

    // Apply realtime/polled updates.
    const unsubscribe = subscribeToRobot({
      orderId,
      onSnapshot: (t) => active && setTask(t),
      onEvent: (event) =>
        active &&
        setTask((prev) => ({
          ...(prev || {}),
          executionStatus: event.robotStatus,
          currentStep: event.currentStep,
          progress: typeof event.progress === 'number' ? event.progress : prev?.progress,
          currentLocation: event.location || prev?.currentLocation,
          assignedRobotId: event.robotId || prev?.assignedRobotId,
          failureReason: event.errorMessage || prev?.failureReason
        }))
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [orderId]);

  if (loading) {
    return <div className="robot-tracker robot-tracker--muted">Loading robot status…</div>;
  }

  if (!task) {
    return (
      <div className="robot-tracker robot-tracker--muted">
        This order has not been dispatched to the robot yet.
      </div>
    );
  }

  const current = task.executionStatus || 'pending';
  const failed = FAILURE_STATES.includes(current);
  const activeIndex = current === 'completed' ? ROBOT_PIPELINE.length : stateIndex(current);
  const progress = typeof task.progress === 'number' ? task.progress : 0;

  return (
    <div className="robot-tracker">
      <div className="robot-tracker__head">
        <div>
          <span className={`robot-dot robot-dot--${failed ? 'fail' : current}`} />
          <strong>Robot status:</strong> {current.replace(/_/g, ' ')}
        </div>
        {task.assignedRobotId ? (
          <span className="robot-tracker__robot">🤖 {task.assignedRobotId}</span>
        ) : null}
      </div>

      {task.currentStep ? <p className="robot-tracker__step">{task.currentStep}</p> : null}

      <div className="robot-progress">
        <div
          className={`robot-progress__bar ${failed ? 'robot-progress__bar--fail' : ''}`}
          style={{ width: `${failed ? 100 : progress}%` }}
        />
      </div>

      {!failed ? (
        <ol className="robot-pipeline">
          {ROBOT_PIPELINE.map((step, idx) => {
            const done = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            return (
              <li
                key={step.state}
                className={`robot-pipeline__step ${done ? 'is-done' : ''} ${
                  isCurrent ? 'is-current' : ''
                }`}
              >
                <span className="robot-pipeline__marker">{done ? '✓' : idx + 1}</span>
                <span className="robot-pipeline__label">{step.label}</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="robot-tracker__error">
          ⚠️ {current === 'cancelled' ? 'Task cancelled' : 'Execution failed'}
          {task.failureReason ? `: ${task.failureReason}` : ''}
        </p>
      )}

      {task.currentLocation && (task.currentLocation.label || task.currentLocation.zone) ? (
        <p className="robot-tracker__loc">
          📍 {task.currentLocation.label || task.currentLocation.zone}
        </p>
      ) : null}

      {Array.isArray(task.feedback) && task.feedback.length ? (
        <details className="robot-tracker__log">
          <summary>Execution log ({task.feedback.length})</summary>
          <ul>
            {task.feedback
              .slice(-12)
              .reverse()
              .map((f, idx) => (
                <li key={idx}>
                  <span className="robot-log__state">{(f.state || '').replace(/_/g, ' ')}</span>
                  <span className="robot-log__msg">{f.step || f.message}</span>
                  <span className="robot-log__time">
                    {f.at ? new Date(f.at).toLocaleTimeString() : ''}
                  </span>
                </li>
              ))}
          </ul>
        </details>
      ) : null}

      <style>{`
        .robot-tracker { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }
        .robot-tracker--muted { color: #6b7280; font-style: italic; }
        .robot-tracker__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
        .robot-tracker__robot { font-size: 0.9rem; color: #374151; }
        .robot-tracker__step { margin: 8px 0 12px; color: #374151; }
        .robot-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; background: #9ca3af; vertical-align: middle; }
        .robot-dot--navigating, .robot-dot--picking, .robot-dot--placing, .robot-dot--product_found, .robot-dot--accepted { background: #3b82f6; animation: robotPulse 1.2s infinite; }
        .robot-dot--completed { background: #10b981; }
        .robot-dot--fail { background: #ef4444; }
        @keyframes robotPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .robot-progress { height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; margin-bottom: 16px; }
        .robot-progress__bar { height: 100%; background: linear-gradient(90deg,#3b82f6,#10b981); transition: width 0.4s ease; }
        .robot-progress__bar--fail { background: #ef4444; }
        .robot-pipeline { list-style: none; display: flex; flex-wrap: wrap; gap: 8px 16px; padding: 0; margin: 0; }
        .robot-pipeline__step { display: flex; align-items: center; gap: 6px; color: #9ca3af; font-size: 0.85rem; }
        .robot-pipeline__step.is-done { color: #10b981; }
        .robot-pipeline__step.is-current { color: #2563eb; font-weight: 600; }
        .robot-pipeline__marker { width: 22px; height: 22px; border-radius: 50%; border: 2px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; }
        .robot-tracker__error { color: #b91c1c; font-weight: 600; }
        .robot-tracker__loc { color: #4b5563; font-size: 0.9rem; margin-top: 8px; }
        .robot-tracker__log { margin-top: 12px; font-size: 0.85rem; }
        .robot-tracker__log ul { list-style: none; padding: 0; margin: 8px 0 0; max-height: 180px; overflow-y: auto; }
        .robot-tracker__log li { display: grid; grid-template-columns: 110px 1fr auto; gap: 8px; padding: 4px 0; border-bottom: 1px dashed #e5e7eb; }
        .robot-log__state { color: #2563eb; text-transform: capitalize; }
        .robot-log__time { color: #9ca3af; }
      `}</style>
    </div>
  );
};

export default RobotTracker;
