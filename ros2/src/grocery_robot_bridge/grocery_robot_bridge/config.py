"""Shared configuration for the grocery robot bridge nodes.

All connection settings are read from environment variables so the same code
runs locally, in the lab, or against the deployed website without edits.
"""
import os


def get_config():
    """Return bridge configuration from environment variables."""
    base_url = os.environ.get('BACKEND_BASE_URL', 'http://localhost:5000').rstrip('/')
    # Ensure we target the /api prefix exactly once.
    if base_url.endswith('/api'):
        api_url = base_url
    else:
        api_url = base_url + '/api'

    return {
        # Backend REST API base, e.g. https://your-site.vercel.app/api
        'api_url': api_url,
        # Robot/controller identifier registered in the website DB.
        'robot_identifier': os.environ.get('ROBOT_IDENTIFIER', 'RPI-HUB-01'),
        # How often (seconds) the bridge polls for new tasks / sends heartbeats.
        'poll_interval': float(os.environ.get('POLL_INTERVAL', '2.0')),
        # HTTP timeout for backend requests.
        'request_timeout': float(os.environ.get('REQUEST_TIMEOUT', '10.0')),
        # 'action' -> bridge drives the ExecuteOrder action and relays its feedback.
        # 'topic'  -> bridge relays /robot/task_feedback messages instead.
        'feedback_source': os.environ.get('FEEDBACK_SOURCE', 'action'),
        # Simulated executor pacing (seconds between steps).
        'sim_step_delay': float(os.environ.get('SIM_STEP_DELAY', '1.5')),
    }
