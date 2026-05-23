"use client";

import { useCallback, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ProjectListItem } from "@/lib/queries/projects";

export function PortfolioGridClient({
  technologies,
  roles,
  initialItems,
}: {
  technologies: string[];
  roles: string[];
  initialItems: ProjectListItem[];
}) {
  const [tech, setTech] = useState("");
  const [role, setRole] = useState("");
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);

  const loadProjects = useCallback(async (nextTech: string, nextRole: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (nextTech) params.set("tech", nextTech);
    if (nextRole) params.set("role", nextRole);

    const response = await fetch(`/api/projects?${params}`);
    const data = (await response.json()) as { items: ProjectListItem[] };
    setItems(data.items);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex-1">
          <span className="mb-1 block text-sm text-muted">Технология</span>
          <select
            value={tech}
            onChange={(event) => {
              const value = event.target.value;
              setTech(value);
              void loadProjects(value, role);
            }}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">Все</option>
            {technologies.map((item) => (
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
            onChange={(event) => {
              const value = event.target.value;
              setRole(value);
              void loadProjects(tech, value);
            }}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">Все</option>
            {roles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? <p className="text-sm text-muted">Загрузка…</p> : null}

      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((project) => (
          <li key={project.id}>
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
