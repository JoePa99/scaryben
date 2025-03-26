// A simple utility to help with providing real-time status updates
// In a production app, this could be implemented with WebSockets or Server-Sent Events

export class StatusUpdater {
  constructor(updateCallback) {
    this.updateCallback = updateCallback;
  }

  update(status) {
    if (this.updateCallback) {
      this.updateCallback(status);
    }
  }

  // Helper methods for common status updates
  thinking() {
    this.update('Franklin is thinking about your question...');
  }

  generating() {
    this.update('Franklin is formulating his response...');
  }

  speaking() {
    this.update('Franklin is preparing his voice...');
  }

  animating() {
    this.update('Franklin is being summoned from the beyond...');
  }

  done() {
    this.update('');
  }
}

export default StatusUpdater;