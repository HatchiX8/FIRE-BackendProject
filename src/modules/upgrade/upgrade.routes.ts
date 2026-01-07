import { Router } from 'express';

import { getUpgradeRequestsController } from './upgrade.controller.js';

export const upgradeRouter = Router();

upgradeRouter.get('/upgrade-requests', getUpgradeRequestsController);
