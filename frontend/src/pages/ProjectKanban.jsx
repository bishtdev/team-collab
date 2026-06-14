import { useParams } from "react-router-dom";
import KanbanBoard from "../components/KanbanBoard";
import ProjectHeader from "../components/ProjectHeader";

const ProjectKanban = () => {
  const { id: projectId } = useParams();

  return (
    <div>
      <ProjectHeader projectId={projectId} />
      <KanbanBoard projectId={projectId} />
    </div>
  );
};

export default ProjectKanban;
