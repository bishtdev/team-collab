import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { FiArrowLeft, FiLoader } from 'react-icons/fi';

const ProjectHeader = ({ projectId }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${projectId}`);
        setProject(res.data);
      } catch (err) {
        console.error('Failed to fetch project', err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="px-5 py-3 border-b border-gray-800/60 bg-gray-950/50 flex items-center gap-2">
        <FiLoader className="animate-spin text-gray-600" />
        <span className="text-sm text-gray-600">Loading project...</span>
      </div>
    );
  }

  return (
    <div className="px-5 py-3 border-b border-gray-800/60 bg-gray-950/50 backdrop-blur-sm flex items-center gap-3">
      <Link
        to="/projects"
        className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        title="Back to Projects"
      >
        <FiArrowLeft className="w-4 h-4" />
      </Link>
      <div className="flex items-center gap-2 text-sm">
        <Link to="/projects" className="text-gray-500 hover:text-gray-300 transition-colors">
          Projects
        </Link>
        <span className="text-gray-700">/</span>
        <span className="text-white font-medium truncate max-w-xs">
          {project?.name || 'Project'}
        </span>
      </div>
    </div>
  );
};

export default ProjectHeader;
