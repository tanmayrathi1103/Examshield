import React from 'react';
import SharedLogin from '../components/portal/SharedLogin';
import SharedPortalLayout from '../components/portal/SharedPortalLayout';
import { adminPortalConfig } from '../config/portalConfig';

const AdminLogin: React.FC = () => {
  return (
    <SharedPortalLayout config={adminPortalConfig}>
      <SharedLogin config={adminPortalConfig} />
    </SharedPortalLayout>
  );
};

export default AdminLogin;
