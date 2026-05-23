"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  mockProjects,
  mockRoles,
  mockTechnologies,
} from "@/data/mock/projects";

export function PortfolioGrid() {
  const [tech, setTech] = useState("");
  const [role, setRole] = useState("");

  const filtered = useMemo(() => {
    return mockProjects.filter((project) => {
      const matchesTech = !tech || project.stack.includes(tech);
      const matchesRole = !role || project.roles.includes(role);
      return matchesTech && matchesRole;
    });
  }, [tech, role]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex-1">
          <span className="mb-1 block text-sm text-muted">Технология</span>
          <select
            value={tech}
            onChange={(event) => setTech(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">Все</option>
            {mockTechnologies.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex-1">
          <span className="mb-1 block text-sm text-muted">Роль</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">Все</option>
            {mockRoles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {filtered.map((project) => (
          <li key={project.slug}>
            <Card href={`/portfolio/${project.slug}`}>
              <h2 className="text-xl font-semibold">{project.title}</h2>
              <p className="mt-2 text-sm text-muted">{project.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.stack.map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
