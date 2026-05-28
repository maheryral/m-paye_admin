import api from './api';

export const dashboardApi = {
  overview: () => api.get('/super-admin/dashboard/overview').then((r) => r.data),
  recentTransactions: (limit = 10) =>
    api
      .get('/super-admin/dashboard/recent-transactions', { params: { limit } })
      .then((r) => r.data),
  pending: () => api.get('/super-admin/dashboard/pending').then((r) => r.data),
  charts: () => api.get('/super-admin/dashboard/charts').then((r) => r.data),
};

export const walletsAdminApi = {
  stats: () => api.get('/super-admin/wallets/stats').then((r) => r.data),
  list: (params: {
    page?: number;
    limit?: number;
    isFrozen?: string;
    q?: string;
  } = {}) => api.get('/super-admin/wallets', { params }).then((r) => r.data),
  freeze: (id: string, reason: string) =>
    api
      .patch(`/super-admin/wallets/${id}/freeze`, { reason })
      .then((r) => r.data),
  unfreeze: (id: string) =>
    api.patch(`/super-admin/wallets/${id}/unfreeze`).then((r) => r.data),
};

export const complianceApi = {
  riskList: (params: {
    page?: number;
    limit?: number;
    level?: string;
    minScore?: number;
  } = {}) =>
    api.get('/super-admin/compliance/risk', { params }).then((r) => r.data),
  riskStats: () =>
    api.get('/super-admin/compliance/risk/stats').then((r) => r.data),
  riskForUser: (userId: string) =>
    api
      .get(`/super-admin/compliance/risk/user/${userId}`)
      .then((r) => r.data),
  recomputeRisk: (userId: string) =>
    api
      .post(`/super-admin/compliance/risk/user/${userId}/recompute`)
      .then((r) => r.data),

  velocityList: () =>
    api.get('/super-admin/compliance/velocity').then((r) => r.data),
  createVelocity: (data: any) =>
    api.post('/super-admin/compliance/velocity', data).then((r) => r.data),
  updateVelocity: (id: string, data: any) =>
    api
      .patch(`/super-admin/compliance/velocity/${id}`, data)
      .then((r) => r.data),
  removeVelocity: (id: string) =>
    api
      .delete(`/super-admin/compliance/velocity/${id}`)
      .then((r) => r.data),

  sanctionsList: (params: {
    page?: number;
    limit?: number;
    q?: string;
    source?: string;
  } = {}) =>
    api
      .get('/super-admin/compliance/sanctions', { params })
      .then((r) => r.data),
  addSanction: (data: any) =>
    api.post('/super-admin/compliance/sanctions', data).then((r) => r.data),
  removeSanction: (id: string) =>
    api
      .delete(`/super-admin/compliance/sanctions/${id}`)
      .then((r) => r.data),
  screenUser: (userId: string) =>
    api
      .get(`/super-admin/compliance/sanctions/screen/${userId}`)
      .then((r) => r.data),

  activitiesList: (params: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    userId?: string;
  } = {}) =>
    api
      .get('/super-admin/compliance/activities', { params })
      .then((r) => r.data),
  activitiesStats: () =>
    api
      .get('/super-admin/compliance/activities/stats')
      .then((r) => r.data),
  updateActivity: (
    id: string,
    data: { status?: string; reviewNote?: string },
  ) =>
    api
      .patch(`/super-admin/compliance/activities/${id}`, data)
      .then((r) => r.data),
  runScan: (days = 7) =>
    api
      .post('/super-admin/compliance/activities/scan', { days })
      .then((r) => r.data),

  reportsList: (params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  } = {}) =>
    api
      .get('/super-admin/compliance/reports', { params })
      .then((r) => r.data),
  createReport: (data: any) =>
    api.post('/super-admin/compliance/reports', data).then((r) => r.data),
  fileReport: (id: string, externalRef?: string) =>
    api
      .patch(`/super-admin/compliance/reports/${id}/file`, { externalRef })
      .then((r) => r.data),
};

export const opsApi = {
  health: () => api.get('/super-admin/ops/health').then((r) => r.data),
  getMaintenance: () =>
    api.get('/super-admin/ops/maintenance').then((r) => r.data),
  setMaintenance: (data: any) =>
    api.put('/super-admin/ops/maintenance', data).then((r) => r.data),
  listVersions: () =>
    api.get('/super-admin/ops/app-versions').then((r) => r.data),
  upsertVersion: (data: any) =>
    api.put('/super-admin/ops/app-versions', data).then((r) => r.data),
  removeVersion: (platform: string) =>
    api
      .delete(`/super-admin/ops/app-versions/${platform}`)
      .then((r) => r.data),
};

export const transportApi = {
  listCoops: (params: { page?: number; limit?: number; q?: string } = {}) =>
    api
      .get('/super-admin/transport/cooperatives', { params })
      .then((r) => r.data),
  upsertCoop: (data: any) =>
    api
      .put('/super-admin/transport/cooperatives', data)
      .then((r) => r.data),
  deleteCoop: (id: string) =>
    api
      .delete(`/super-admin/transport/cooperatives/${id}`)
      .then((r) => r.data),
  listGares: () =>
    api.get('/super-admin/transport/gares').then((r) => r.data),
  upsertGare: (data: any) =>
    api.put('/super-admin/transport/gares', data).then((r) => r.data),
  listChauffeurs: (params: { page?: number; limit?: number; q?: string } = {}) =>
    api
      .get('/super-admin/transport/chauffeurs', { params })
      .then((r) => r.data),
  setChauffeurStatut: (id: string, statut: string) =>
    api
      .patch(`/super-admin/transport/chauffeurs/${id}/statut`, { statut })
      .then((r) => r.data),
  upsertChauffeur: (data: any) =>
    api
      .put('/super-admin/transport/chauffeurs', data)
      .then((r) => r.data),
  deleteChauffeur: (id: string) =>
    api
      .delete(`/super-admin/transport/chauffeurs/${id}`)
      .then((r) => r.data),
  voyagesStats: () =>
    api.get('/super-admin/transport/voyages/stats').then((r) => r.data),
  listTarifs: () =>
    api.get('/super-admin/transport/tarifs').then((r) => r.data),
  createTarif: (data: any) =>
    api.post('/super-admin/transport/tarifs', data).then((r) => r.data),
  deleteTarif: (id: string) =>
    api
      .delete(`/super-admin/transport/tarifs/${id}`)
      .then((r) => r.data),
  listClasses: () =>
    api.get('/super-admin/transport/classes').then((r) => r.data),
  upsertClasse: (data: any) =>
    api.put('/super-admin/transport/classes', data).then((r) => r.data),
  deleteClasse: (id: string) =>
    api.delete(`/super-admin/transport/classes/${id}`).then((r) => r.data),

  // Voitures
  listVoitures: (params: {
    page?: number;
    limit?: number;
    q?: string;
    etat?: string;
    cooperativeId?: string;
  } = {}) =>
    api
      .get('/super-admin/transport/voitures', { params })
      .then((r) => r.data),
  upsertVoiture: (data: any) =>
    api.put('/super-admin/transport/voitures', data).then((r) => r.data),
  deleteVoiture: (id: string) =>
    api
      .delete(`/super-admin/transport/voitures/${id}`)
      .then((r) => r.data),
  setVoitureEtat: (id: string, etat: string) =>
    api
      .patch(`/super-admin/transport/voitures/${id}/etat`, { etat })
      .then((r) => r.data),
  maintenanceAlerts: () =>
    api
      .get('/super-admin/transport/voitures/maintenance-alerts')
      .then((r) => r.data),
  listColonnes: (voitureId: string) =>
    api
      .get(`/super-admin/transport/voitures/${voitureId}/colonnes`)
      .then((r) => r.data),
  upsertColonneCar: (data: any) =>
    api
      .put('/super-admin/transport/voitures/colonnes/car', data)
      .then((r) => r.data),
  deleteColonneCar: (id: string) =>
    api
      .delete(`/super-admin/transport/voitures/colonnes/car/${id}`)
      .then((r) => r.data),

  // Plan de places (seat layout)
  getLayout: (voitureId: string) =>
    api
      .get(`/super-admin/transport/voitures/${voitureId}/layout`)
      .then((r) => r.data),
  saveLayout: (voitureId: string, layout: any, autoUpdateCapacity = true) =>
    api
      .put(`/super-admin/transport/voitures/${voitureId}/layout`, {
        layout,
        autoUpdateCapacity,
      })
      .then((r) => r.data),
  getVoyageLayout: (voyageId: string) =>
    api
      .get(`/super-admin/transport/voyages/${voyageId}/layout`)
      .then((r) => r.data),

  // Voyages
  listVoyages: (params: {
    page?: number;
    limit?: number;
    statut?: string;
    cooperativeId?: string;
    from?: string;
    to?: string;
    q?: string;
  } = {}) =>
    api.get('/super-admin/transport/voyages', { params }).then((r) => r.data),
  getVoyage: (id: string) =>
    api.get(`/super-admin/transport/voyages/${id}`).then((r) => r.data),
  upsertVoyage: (data: any) =>
    api.put('/super-admin/transport/voyages', data).then((r) => r.data),
  cancelVoyage: (id: string, reason: string) =>
    api
      .patch(`/super-admin/transport/voyages/${id}/cancel`, { reason })
      .then((r) => r.data),
  setVoyageStatut: (id: string, statut: string) =>
    api
      .patch(`/super-admin/transport/voyages/${id}/statut`, { statut })
      .then((r) => r.data),
  getPlaces: (voyageId: string) =>
    api
      .get(`/super-admin/transport/voyages/${voyageId}/places`)
      .then((r) => r.data),

  // Réservations
  listReservations: (params: any = {}) =>
    api
      .get('/super-admin/transport/reservations', { params })
      .then((r) => r.data),
  refundReservation: (id: string, reason: string) =>
    api
      .patch(`/super-admin/transport/reservations/${id}/refund`, { reason })
      .then((r) => r.data),
  markNoShow: (id: string) =>
    api
      .patch(`/super-admin/transport/reservations/${id}/no-show`)
      .then((r) => r.data),

  // Paiements
  listPaiements: (params: any = {}) =>
    api
      .get('/super-admin/transport/paiements', { params })
      .then((r) => r.data),
  refundPaiement: (id: string) =>
    api
      .patch(`/super-admin/transport/paiements/${id}/refund`)
      .then((r) => r.data),

  // Annonces
  listAnnonces: (params: any = {}) =>
    api
      .get('/super-admin/transport/annonces', { params })
      .then((r) => r.data),
  upsertAnnonce: (data: any) =>
    api.put('/super-admin/transport/annonces', data).then((r) => r.data),
  deleteAnnonce: (id: string) =>
    api
      .delete(`/super-admin/transport/annonces/${id}`)
      .then((r) => r.data),

  // Stats avancées
  statsChauffeur: (id: string) =>
    api
      .get(`/super-admin/transport/stats/chauffeur/${id}`)
      .then((r) => r.data),
  statsCooperative: (id: string) =>
    api
      .get(`/super-admin/transport/stats/cooperative/${id}`)
      .then((r) => r.data),

  // Historique
  listHistorique: (params: any = {}) =>
    api
      .get('/super-admin/transport/historique', { params })
      .then((r) => r.data),
};

export const marketingApi = {
  listFlags: () =>
    api.get('/super-admin/marketing/flags').then((r) => r.data),
  upsertFlag: (data: any) =>
    api.put('/super-admin/marketing/flags', data).then((r) => r.data),
  deleteFlag: (id: string) =>
    api
      .delete(`/super-admin/marketing/flags/${id}`)
      .then((r) => r.data),
  couponAnalytics: () =>
    api
      .get('/super-admin/marketing/coupons/analytics')
      .then((r) => r.data),
  listReferrals: (params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) =>
    api
      .get('/super-admin/marketing/referrals', { params })
      .then((r) => r.data),
  referralStats: () =>
    api
      .get('/super-admin/marketing/referrals/stats')
      .then((r) => r.data),
  listLoyalty: () =>
    api.get('/super-admin/marketing/loyalty').then((r) => r.data),
  upsertLoyalty: (data: any) =>
    api.put('/super-admin/marketing/loyalty', data).then((r) => r.data),
  deleteLoyalty: (id: string) =>
    api
      .delete(`/super-admin/marketing/loyalty/${id}`)
      .then((r) => r.data),
};

export const commsApi = {
  listTemplates: (params: { channel?: string; q?: string } = {}) =>
    api.get('/super-admin/comms/templates', { params }).then((r) => r.data),
  upsertTemplate: (data: any) =>
    api.put('/super-admin/comms/templates', data).then((r) => r.data),
  deleteTemplate: (id: string) =>
    api
      .delete(`/super-admin/comms/templates/${id}`)
      .then((r) => r.data),
  listScheduled: (status?: string) =>
    api
      .get('/super-admin/comms/scheduled', { params: { status } })
      .then((r) => r.data),
  createScheduled: (data: any) =>
    api.post('/super-admin/comms/scheduled', data).then((r) => r.data),
  cancelScheduled: (id: string) =>
    api
      .patch(`/super-admin/comms/scheduled/${id}/cancel`)
      .then((r) => r.data),
  listTickets: (params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    q?: string;
  } = {}) =>
    api.get('/super-admin/comms/tickets', { params }).then((r) => r.data),
  ticketsStats: () =>
    api.get('/super-admin/comms/tickets/stats').then((r) => r.data),
  getTicket: (id: string) =>
    api.get(`/super-admin/comms/tickets/${id}`).then((r) => r.data),
  addMessage: (id: string, data: { body: string; isInternal?: boolean }) =>
    api
      .post(`/super-admin/comms/tickets/${id}/messages`, data)
      .then((r) => r.data),
  setTicketStatus: (id: string, status: string) =>
    api
      .patch(`/super-admin/comms/tickets/${id}/status`, { status })
      .then((r) => r.data),
};

export const securityPlusApi = {
  failedLogins: (days = 7) =>
    api
      .get('/super-admin/security-plus/failed-logins', { params: { days } })
      .then((r) => r.data),
  listDevices: (params: { page?: number; limit?: number; q?: string } = {}) =>
    api
      .get('/super-admin/security-plus/devices', { params })
      .then((r) => r.data),
  blockDevice: (deviceId: string, reason: string) =>
    api
      .post('/super-admin/security-plus/devices', { deviceId, reason })
      .then((r) => r.data),
  unblockDevice: (id: string) =>
    api
      .delete(`/super-admin/security-plus/devices/${id}`)
      .then((r) => r.data),
  get2fa: () => api.get('/super-admin/security-plus/2fa').then((r) => r.data),
  set2fa: (data: any) =>
    api.put('/super-admin/security-plus/2fa', data).then((r) => r.data),
  twofaStats: () =>
    api.get('/super-admin/security-plus/2fa/stats').then((r) => r.data),
};

export const auditApi = {
  list: (params: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    from?: string;
    to?: string;
  } = {}) => api.get('/super-admin/audit', { params }).then((r) => r.data),
};

export const kycAdminApi = {
  stats: () => api.get('/super-admin/kyc/stats').then((r) => r.data),
  list: (params: { page?: number; limit?: number; status?: string } = {}) =>
    api.get('/super-admin/kyc', { params }).then((r) => r.data),
  getOne: (id: string) =>
    api.get(`/super-admin/kyc/${id}`).then((r) => r.data),
  approve: (id: string, notes?: string) =>
    api.patch(`/super-admin/kyc/${id}/approve`, { notes }).then((r) => r.data),
  reject: (id: string, reason: string) =>
    api.patch(`/super-admin/kyc/${id}/reject`, { reason }).then((r) => r.data),
};

export const withdrawalsAdminApi = {
  stats: () => api.get('/super-admin/withdrawals/stats').then((r) => r.data),
  list: (params: { page?: number; limit?: number; status?: string } = {}) =>
    api.get('/super-admin/withdrawals', { params }).then((r) => r.data),
  getOne: (id: string) =>
    api.get(`/super-admin/withdrawals/${id}`).then((r) => r.data),
  start: (id: string) =>
    api.patch(`/super-admin/withdrawals/${id}/processing`).then((r) => r.data),
  complete: (id: string, bankReference?: string) =>
    api
      .patch(`/super-admin/withdrawals/${id}/complete`, { bankReference })
      .then((r) => r.data),
  fail: (id: string, reason: string) =>
    api
      .patch(`/super-admin/withdrawals/${id}/fail`, { reason })
      .then((r) => r.data),
};

export const transactionsAdminApi = {
  list: (params: {
    page?: number;
    limit?: number;
    q?: string;
    type?: string;
    statut?: string;
    userId?: string;
    merchantId?: string;
    from?: string;
    to?: string;
  } = {}) => api.get('/super-admin/transactions', { params }).then((r) => r.data),
  getOne: (id: string) =>
    api.get(`/super-admin/transactions/${id}`).then((r) => r.data),
};

export const refundsAdminApi = {
  stats: () => api.get('/super-admin/refunds/stats').then((r) => r.data),
  list: (params: { page?: number; limit?: number; status?: string } = {}) =>
    api.get('/super-admin/refunds', { params }).then((r) => r.data),
  getOne: (id: string) =>
    api.get(`/super-admin/refunds/${id}`).then((r) => r.data),
  approve: (id: string, note?: string) =>
    api.patch(`/super-admin/refunds/${id}/approve`, { note }).then((r) => r.data),
  complete: (id: string) =>
    api.patch(`/super-admin/refunds/${id}/complete`).then((r) => r.data),
  reject: (id: string, reason: string) =>
    api
      .patch(`/super-admin/refunds/${id}/reject`, { reason })
      .then((r) => r.data),
};

export const usersAdminApi = {
  list: (params: {
    page?: number;
    limit?: number;
    q?: string;
    role?: string;
    isActive?: string;
  } = {}) => api.get('/super-admin/users', { params }).then((r) => r.data),
  getOne: (id: string) =>
    api.get(`/super-admin/users/${id}`).then((r) => r.data),
  setActive: (id: string, isActive: boolean) =>
    api.patch(`/super-admin/users/${id}/active`, { isActive }).then((r) => r.data),
  setRole: (id: string, role: string) =>
    api.patch(`/super-admin/users/${id}/role`, { role }).then((r) => r.data),
  resetPassword: (id: string, newPassword: string) =>
    api
      .post(`/super-admin/users/${id}/reset-password`, { newPassword })
      .then((r) => r.data),
  revokeSessions: (id: string) =>
    api.post(`/super-admin/users/${id}/revoke-sessions`).then((r) => r.data),
  sessions: (id: string) =>
    api.get(`/super-admin/users/${id}/sessions`).then((r) => r.data),
  loginHistory: (id: string) =>
    api.get(`/super-admin/users/${id}/login-history`).then((r) => r.data),
};

export const merchantsAdminApi = {
  stats: () => api.get('/super-admin/merchants/stats').then((r) => r.data),
  list: (params: {
    page?: number;
    limit?: number;
    q?: string;
    validationStatus?: string;
    isActive?: string;
  } = {}) => api.get('/super-admin/merchants', { params }).then((r) => r.data),
  getOne: (id: string) =>
    api.get(`/super-admin/merchants/${id}`).then((r) => r.data),
  approve: (id: string) =>
    api.patch(`/super-admin/merchants/${id}/approve`).then((r) => r.data),
  reject: (id: string, reason: string) =>
    api
      .patch(`/super-admin/merchants/${id}/reject`, { reason })
      .then((r) => r.data),
  suspend: (id: string, reason: string) =>
    api
      .patch(`/super-admin/merchants/${id}/suspend`, { reason })
      .then((r) => r.data),
  reactivate: (id: string) =>
    api.patch(`/super-admin/merchants/${id}/reactivate`).then((r) => r.data),
};

export const broadcastApi = {
  preview: (data: any) =>
    api.post('/super-admin/broadcast/preview', data).then((r) => r.data),
  send: (data: any) =>
    api.post('/super-admin/broadcast/send', data).then((r) => r.data),
};

export const ipBlacklistApi = {
  stats: () =>
    api.get('/super-admin/security/ip-blacklist/stats').then((r) => r.data),
  list: (params: { page?: number; limit?: number; q?: string } = {}) =>
    api
      .get('/super-admin/security/ip-blacklist', { params })
      .then((r) => r.data),
  create: (data: {
    ipAddress: string;
    reason: string;
    isPermanent?: boolean;
    expiresAt?: string;
  }) =>
    api
      .post('/super-admin/security/ip-blacklist', data)
      .then((r) => r.data),
  remove: (id: string) =>
    api
      .delete(`/super-admin/security/ip-blacklist/${id}`)
      .then((r) => r.data),
};

export const fxRatesApi = {
  list: () => api.get('/super-admin/fx-rates').then((r) => r.data),
  upsert: (data: { paire: string; taux: number }) =>
    api.put('/super-admin/fx-rates', data).then((r) => r.data),
  remove: (paire: string) =>
    api.delete(`/super-admin/fx-rates/${paire}`).then((r) => r.data),
};

export const reclamationsAdminApi = {
  stats: () => api.get('/super-admin/reclamations/stats').then((r) => r.data),
  list: (params: {
    page?: number;
    limit?: number;
    statut?: string;
    q?: string;
  } = {}) =>
    api.get('/super-admin/reclamations', { params }).then((r) => r.data),
  getOne: (id: string) =>
    api.get(`/super-admin/reclamations/${id}`).then((r) => r.data),
  updateStatut: (id: string, statut: string) =>
    api
      .patch(`/super-admin/reclamations/${id}/statut`, { statut })
      .then((r) => r.data),
};

export const exportsApi = {
  users: () =>
    api
      .get('/super-admin/exports/users.csv', { responseType: 'blob' })
      .then((r) => r.data as Blob),
  transactions: (params: { from?: string; to?: string } = {}) =>
    api
      .get('/super-admin/exports/transactions.csv', {
        params,
        responseType: 'blob',
      })
      .then((r) => r.data as Blob),
  revenue: (params: { from?: string; to?: string } = {}) =>
    api
      .get('/super-admin/exports/revenue.csv', {
        params,
        responseType: 'blob',
      })
      .then((r) => r.data as Blob),
};

export const adminsApi = {
  catalog: () =>
    api
      .get('/super-admin/admins/permissions/catalog')
      .then((r) => r.data),
  listTemplates: () =>
    api.get('/super-admin/admins/templates').then((r) => r.data),
  upsertTemplate: (data: any) =>
    api.put('/super-admin/admins/templates', data).then((r) => r.data),
  deleteTemplate: (id: string) =>
    api
      .delete(`/super-admin/admins/templates/${id}`)
      .then((r) => r.data),

  list: () => api.get('/super-admin/admins').then((r) => r.data),
  getOne: (id: string) =>
    api.get(`/super-admin/admins/${id}`).then((r) => r.data),
  create: (data: any) =>
    api.post('/super-admin/admins', data).then((r) => r.data),
  updatePermissions: (
    id: string,
    permissions: string[],
    adminLabel?: string,
  ) =>
    api
      .patch(`/super-admin/admins/${id}/permissions`, {
        permissions,
        adminLabel,
      })
      .then((r) => r.data),
  setActive: (id: string, isActive: boolean) =>
    api
      .patch(`/super-admin/admins/${id}/active`, { isActive })
      .then((r) => r.data),
  promote: (id: string) =>
    api.post(`/super-admin/admins/${id}/promote`).then((r) => r.data),
  demote: (id: string, permissions: string[]) =>
    api
      .post(`/super-admin/admins/${id}/demote`, { permissions })
      .then((r) => r.data),
  resetPassword: (id: string, newPassword: string) =>
    api
      .post(`/super-admin/admins/${id}/reset-password`, { newPassword })
      .then((r) => r.data),
};

export const feesAdminApi = {
  list: () => api.get('/super-admin/fees').then((r) => r.data),
  create: (data: any) =>
    api.post('/super-admin/fees', data).then((r) => r.data),
  update: (id: string, data: any) =>
    api.patch(`/super-admin/fees/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/super-admin/fees/${id}`).then((r) => r.data),
  revenue: (params: { from?: string; to?: string } = {}) =>
    api
      .get('/super-admin/fees/revenue/summary', { params })
      .then((r) => r.data),
  platformWallets: () =>
    api.get('/super-admin/fees/platform/wallets').then((r) => r.data),
};

export const paymentRequestsAdminApi = {
  stats: () =>
    api.get('/super-admin/payment-requests/stats').then((r) => r.data),
  list: (params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    method?: string;
    q?: string;
  } = {}) =>
    api
      .get('/super-admin/payment-requests', { params })
      .then((r) => r.data),
  getOne: (id: string) =>
    api.get(`/super-admin/payment-requests/${id}`).then((r) => r.data),
  approve: (id: string, adminNotes?: string) =>
    api
      .patch(`/super-admin/payment-requests/${id}/approve`, { adminNotes })
      .then((r) => r.data),
  reject: (id: string, reason: string) =>
    api
      .patch(`/super-admin/payment-requests/${id}/reject`, { reason })
      .then((r) => r.data),
};
