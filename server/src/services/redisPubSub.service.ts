import { getRedisPublisher, getRedisSubscriber } from '../config/redis.js';

export interface ScoreUpdateEvent {
  type: 'SCORE_UPDATED' | 'LEADERBOARD_RESET' | 'CONTEST_STATUS_CHANGED';
  contestId: string;
  studentId: string;
  studentName: string;
  studentIdCode: string;
  department: string;
  score: number;
  maximumScore: number;
  previousRank?: number | null;
  newRank: number;
  rankDelta: number;
  submittedAt: string;
}

export type ScoreUpdateListener = (event: ScoreUpdateEvent) => void;

export class RedisPubSubService {
  private static listeners: Set<ScoreUpdateListener> = new Set();
  private static isSubscribedToPattern = false;

  /**
   * Channel name for contest score updates
   */
  public static getChannel(contestId: string): string {
    return `contest:${contestId}:updates`;
  }

  /**
   * Publishes a validated score update event to Redis Pub/Sub
   */
  public static async publishScoreUpdate(event: ScoreUpdateEvent): Promise<number> {
    const publisher = getRedisPublisher();
    const channel = this.getChannel(event.contestId);
    const message = JSON.stringify(event);

    return await publisher.publish(channel, message);
  }

  /**
   * Initializes pattern subscription for all contest updates: contest:*:updates
   */
  public static async initSubscriber(): Promise<void> {
    if (this.isSubscribedToPattern) return;

    const subscriber = getRedisSubscriber();

    await subscriber.pSubscribe('contest:*:updates', (message, channel) => {
      try {
        const parsed: ScoreUpdateEvent = JSON.parse(message);
        // Forward to all registered application listeners (e.g., Socket.IO)
        for (const listener of this.listeners) {
          listener(parsed);
        }
      } catch (err) {
        console.error(`[RedisPubSub] Failed to parse message on ${channel}:`, err);
      }
    });

    this.isSubscribedToPattern = true;
    console.log('[RedisPubSub] Subscribed to pattern: contest:*:updates');
  }

  /**
   * Registers a callback listener (e.g. from Socket.IO service)
   */
  public static addListener(listener: ScoreUpdateListener): void {
    this.listeners.add(listener);
  }

  /**
   * Removes a callback listener
   */
  public static removeListener(listener: ScoreUpdateListener): void {
    this.listeners.delete(listener);
  }
}
