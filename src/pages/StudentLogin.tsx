import React from 'react';
import SharedLogin from '../components/portal/SharedLogin';
import SharedPortalLayout from '../components/portal/SharedPortalLayout';
import { studentPortalConfig } from '../config/portalConfig';

const StudentLogin: React.FC = () => {
  return (
    <SharedPortalLayout config={studentPortalConfig}>
      <SharedLogin config={studentPortalConfig} />
    </SharedPortalLayout>
  );
};

export default StudentLogin;
