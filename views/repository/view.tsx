/** @format */

import type { CSSProperties } from "react";
import { ThemeProvider, ErrorBoundary, useToolContext } from "mcp-use/react";

interface GithubRepoInfo {
  name: string;
  description: string;
  forks_count: number;
  stargazers_count: number;
  language: string;
  open_issues_count: number;
  html_url: string;
}

// Main View
export default function RepositoryView() {
  return (
    <ThemeProvider>
      <ErrorBoundary
        fallback={
          <ErrorState
            title='Something went wrong'
            message='Unable to render repository information.'
          />
        }>
        <RepositoryContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

// Repository Content
function RepositoryContent() {
  const { status, toolInput, toolOutput, error } =
    useToolContext<"get-repository-overview">();

  // Loading State
  if (status === "pending") {
    return (
      <main style={styles.container}>
        <div style={styles.loading}>
          <span style={styles.spinner}>⏳</span>
          <h3>Fetching repository information</h3>
          <p style={styles.muted}>
            Loading {toolInput?.repo ?? "GitHub repository"}...
          </p>
        </div>
      </main>
    );
  }

  // Tool Execution Error
  if (status === "error") {
    return (
      <main style={styles.container}>
        <ErrorState
          title='Failed to fetch repository'
          message={error.message}
        />
      </main>
    );
  }

  // Successful Response
  const repo = toolOutput as GithubRepoInfo;

  // Defensive validation
  if (
    !repo ||
    typeof repo.name !== "string" ||
    typeof repo.html_url !== "string"
  ) {
    return (
      <main style={styles.container}>
        <ErrorState
          title='Invalid repository response'
          message='The server returned incomplete repository information.'
        />
      </main>
    );
  }

  return (
    <main style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.repoIdentity}>
          <div style={styles.avatar}>GH</div>

          <div>
            <h1 style={styles.title}>{repo.name}</h1>
            <p style={styles.muted}>GitHub Repository Insights</p>
          </div>
        </div>

        <span style={styles.language}>{repo.language || "Unknown"}</span>
      </header>

      {/* Description */}
      <section style={styles.descriptionBox}>
        <h3 style={styles.sectionTitle}>About Repository</h3>

        <p style={styles.description}>
          {repo.description || "No description available."}
        </p>
      </section>

      {/* Statistics */}
      <section>
        <h3 style={styles.sectionTitle}>Repository Statistics</h3>

        <div style={styles.stats}>
          <StatCard icon='⭐' label='Stars' value={repo.stargazers_count} />

          <StatCard icon='🍴' label='Forks' value={repo.forks_count} />

          <StatCard
            icon='🐛'
            label='Open Issues'
            value={repo.open_issues_count}
          />
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <a
          href={repo.html_url}
          target='_blank'
          rel='noopener noreferrer'
          style={styles.link}>
          View on GitHub
          <span> ↗</span>
        </a>

        <a
          href={`${repo.html_url}/issues`}
          target='_blank'
          rel='noopener noreferrer'
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "1px solid var(--app-border)",
            color: "var(--app-foreground)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "14px",
          }}>
          Open Issues ↗
        </a>
      </footer>
    </main>
  );
}

// Statistics Card
function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div style={styles.card}>
      <span style={styles.cardIcon}>{icon}</span>

      <h2 style={styles.statValue}>{value.toLocaleString()}</h2>

      <p style={styles.muted}>{label}</p>
    </div>
  );
}

// Reusable Error Component
function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div style={styles.errorContainer}>
      <span style={styles.errorIcon}>⚠️</span>

      <h2 style={styles.errorTitle}>{title}</h2>

      <p style={styles.errorMessage}>{message}</p>
    </div>
  );
}

// Theme-aware Styles
const styles: Record<string, CSSProperties> = {
  container: {
    padding: "24px",
    maxWidth: "700px",
    margin: "0 auto",
    color: "CanvasText",
    backgroundColor: "Canvas",
    fontFamily: "system-ui, sans-serif",
    colorScheme: "light dark",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },

  repoIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#24292f",
    color: "#ffffff",
    fontWeight: 700,
  },

  title: {
    fontSize: "23px",
    fontWeight: 700,
    margin: 0,
  },

  muted: {
    color: "GrayText",
    fontSize: "13px",
    margin: "6px 0 0",
  },

  language: {
    padding: "6px 12px",
    border: "1px solid GrayText",
    borderRadius: "20px",
    fontSize: "12px",
  },

  descriptionBox: {
    padding: "18px",
    border: "1px solid color-mix(in srgb, CanvasText 15%, transparent)",
    borderRadius: "12px",
    marginBottom: "24px",
  },

  sectionTitle: {
    fontSize: "15px",
    fontWeight: 600,
    margin: "0 0 14px",
  },

  description: {
    fontSize: "14px",
    lineHeight: 1.6,
    margin: 0,
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },

  card: {
    padding: "18px 10px",
    border: "1px solid color-mix(in srgb, CanvasText 15%, transparent)",
    borderRadius: "12px",
    textAlign: "center",
  },

  cardIcon: {
    fontSize: "22px",
  },

  statValue: {
    fontSize: "23px",
    fontWeight: 700,
    margin: "10px 0 4px",
  },

  footer: {
    marginTop: "24px",
    paddingTop: "18px",
    borderTop: "1px solid color-mix(in srgb, CanvasText 15%, transparent)",
  },

  link: {
    color: "LinkText",
    fontSize: "14px",
    fontWeight: 600,
    textDecoration: "none",
  },

  loading: {
    textAlign: "center",
    padding: "50px 10px",
  },

  spinner: {
    fontSize: "32px",
  },

  errorContainer: {
    textAlign: "center",
    padding: "35px 20px",
    border: "1px solid #dc6464",
    borderRadius: "12px",
    background: "color-mix(in srgb, #dc6464 7%, Canvas)",
  },

  errorIcon: {
    fontSize: "32px",
  },

  errorTitle: {
    fontSize: "18px",
    margin: "12px 0 8px",
  },

  errorMessage: {
    fontSize: "13px",
    color: "GrayText",
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },
};
