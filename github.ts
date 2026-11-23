/** @format */

export type GithubRepoInfoType = {
  name: string;
  description: string | null;
  forks_count: number;
  stargazers_count: number;
  language: string | null;
  open_issues_count: number;
  html_url: string;
};

export const fetchGithubRepoInfo = async (
  repo: string,
  owner: string
): Promise<GithubRepoInfoType> => {
  try {
    const trimmedRepo = repo.trim();
    const trimmedOwner = owner.trim();

    if (!trimmedOwner) {
      throw new Error("Owner name is required");
    }
    if (!trimmedRepo) {
      throw new Error("Repository name is required");
    }

    const URL = `https://api.github.com/repos/${encodeURIComponent(
      trimmedOwner
    )}/${encodeURIComponent(trimmedRepo)}`;

    const response = await fetch(URL, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "fetch-github-repo-info",
      },
    });

    if (response.status === 404) {
      throw new Error(`Repository ${trimmedOwner}/${trimmedRepo} not found`);
    }
    if (response.status === 403) {
      throw new Error(`API rate limit exceeded. Please try again later.`);
    }
    if (!response.ok) {
      throw new Error(
        `Failed to fetch repository info: ${response.statusText}`
      );
    }

    const data = (await response.json()) as GithubRepoInfoType;

    return {
      name: data.name,
      description: data.description,
      forks_count: data.forks_count,
      stargazers_count: data?.stargazers_count,
      language: data.language,
      open_issues_count: data.open_issues_count,
      html_url: data.html_url,
    };
  } catch (error: any) {
    throw new Error(`Message: ${error.message}\n\n Stack: ${error.stack}`);
  }
};
