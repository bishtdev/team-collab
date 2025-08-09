// src/components/ProjectHeader.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ProjectHeader = ({ projectId }) => {
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        const res = await api.get('/projects');
        const selected = res.data.find((p) => p._id === projectId);
        setProject(selected);
      } catch (err) {
        console.error('Failed to fetch project:', err);
      }
    };

    loadProject();
  }, [projectId]);

  if (!project) return null;

  return (
    <div className="flex justify-between items-center mb-4 p-4 bg-gray-900 border-b border-gray-800">
    <div>
      <h2 className="text-2xl font-bold text-white">{project.name}</h2>
      {project.description && (
        <p className="text-sm text-gray-400">{project.description}</p>
      )}
    </div>
  </div>
  );
};

export default ProjectHeader;
