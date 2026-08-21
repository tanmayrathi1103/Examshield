import React from 'react';
import SharedLogin from '../components/portal/SharedLogin';
import SharedPortalLayout from '../components/portal/SharedPortalLayout';
import { facultyPortalConfig } from '../config/portalConfig';

const FacultyLogin: React.FC = () => {
  return (
    <SharedPortalLayout config={facultyPortalConfig}>
      <SharedLogin config={facultyPortalConfig} />
    </SharedPortalLayout>
  );
};

export default FacultyLogin;
