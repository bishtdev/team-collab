// src/components/ProjectHeader.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ProjectHeader = ({ projectId }) => {
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    const load = async () => {
      try {
        const res = await api.get('/projects'); // if no single-project endpoint, filter client-side
        const p = res.data.find((pr) => pr._id === projectId);
        setProject(p);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [projectId]);

  if (!project) return null;
  return (
    <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p className="text-sm">{project.description}</p>
    </div>
  );
};

export default ProjectHeader;
