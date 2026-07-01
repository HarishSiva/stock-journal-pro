type EventCallback = () => void;

class EventBus {
  private events: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(callback);
  }

  emit(event: string) {
    const callbacks = this.events[event];
    if (!callbacks) return;

    callbacks.forEach((cb) => {
  try {
    cb();
  } catch (err) {
    console.error("Event handler error:", err);
  }
});
  }

  off(event: string, callback: EventCallback) {
    this.events[event] = (this.events[event] || []).filter(
      (cb) => cb !== callback
    );
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  ORDERS_UPDATED: "ORDERS_UPDATED",
};