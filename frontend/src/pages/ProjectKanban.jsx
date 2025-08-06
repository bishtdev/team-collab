import { useParams } from "react-router-dom";
import KanbanBoard from "../components/KanbanBoard";
import ProjectHeader from "../components/ProjectHeader";
import { useState } from "react";
import api from "../services/api";

const ProjectKanban = () => {
  const { id: projectId } = useParams();
  const [tasks, setTasks] = useState([]);

  const createTask = async (title) => {
    try {
      const res = await api.post('/tasks', {
        title,
        status: 'todo',
        projectId,
      });
      setTasks(prev => [...prev, res.data]);
    } catch (err) {
      console.error('Task creation failed', err);
    }
  };

  return (
    <div>
      <ProjectHeader projectId={projectId} createTask={createTask} />
      <KanbanBoard projectId={projectId} tasks={tasks} setTasks={setTasks} />
    </div>
  );
};

export default ProjectKanban;