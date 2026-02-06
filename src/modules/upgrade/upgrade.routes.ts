import { Router } from 'express';

import {
  getUpgradeRequestsController,
  getUserListController,
  reviewUpgradeRequestController,
  patchUserActivationController,
} from './upgrade.controller.js';

export const upgradeRouter = Router();

upgradeRouter.get('/upgrade-requests', getUpgradeRequestsController);
upgradeRouter.get('/member', getUserListController);
upgradeRouter.patch('/upgrade-requests/:userId/review', reviewUpgradeRequestController);
upgradeRouter.patch('/users/:userId/activation', patchUserActivationController);
