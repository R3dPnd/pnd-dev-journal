export interface Project {
  id: string;
  title: string;
  description: string;
  serviceDirectory: string;
}

export const projects: Project[] = [
  {
    id: 'pnd-dev-journal',
    title: 'Dev Journal',
    description: 'This application',
    serviceDirectory: 'C:\\Git\\pnd\\pnd-dev-journal',
  },
];
