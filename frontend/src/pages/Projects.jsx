import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const { user } = useAuth();

  const load = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Projects</h2>
      <div className="grid gap-4">
        {projects.map((p) => (
          <div key={p._id} className="p-4 border rounded bg-white dark:bg-gray-800">
            <div className="font-bold">{p.name}</div>
            <div className="text-sm">{p.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
