import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImportLeadsDialog from '../../../features/crm/components/ImportLeadsDialog/ImportLeadsDialog';

const ImportLeadsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ImportLeadsDialog
      open={true}
      onClose={() => navigate('/admin/leads')}
    />
  );
};

export default ImportLeadsPage;