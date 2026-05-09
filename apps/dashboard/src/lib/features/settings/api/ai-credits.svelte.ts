import { BaseApi, classroomio } from '$lib/utils/services/api';
import type {
  AiUsageData,
  GetLeaderboardRequest,
  GetPurchasedRequest,
  GetUsageRequest,
  LeaderboardData,
  PurchasedSummaryData
} from '../utils/types';

class AiCreditsApi extends BaseApi {
  usage = $state<AiUsageData | null>(null);
  purchased = $state<PurchasedSummaryData | null>(null);
  leaderboard = $state<LeaderboardData | null>(null);

  async fetchAll() {
    await Promise.all([this.fetchUsage(), this.fetchPurchased(), this.fetchLeaderboard()]);
  }

  async fetchUsage() {
    await this.execute<GetUsageRequest>({
      requestFn: () => classroomio.agent.usage.$get(),
      logContext: 'fetching AI usage',
      onSuccess: (result) => {
        this.usage = result.data;
      }
    });
  }

  async fetchPurchased() {
    await this.execute<GetPurchasedRequest>({
      requestFn: () => classroomio.agent.usage.purchased.$get(),
      logContext: 'fetching purchased summary',
      onSuccess: (result) => {
        this.purchased = result.data;
      }
    });
  }

  async fetchLeaderboard() {
    await this.execute<GetLeaderboardRequest>({
      requestFn: () => classroomio.agent.usage.leaderboard.$get(),
      logContext: 'fetching AI usage leaderboard',
      onSuccess: (result) => {
        this.leaderboard = result.data;
      }
    });
  }
}

export const aiCreditsApi = new AiCreditsApi();
