package db

// Models mirror flow.db tables. Mirrored, not imported, to keep flow-ui
// decoupled from the flow binary's internal packages.

type Project struct {
	Slug       string  `json:"slug"`
	Name       string  `json:"name"`
	Status     string  `json:"status"`
	Priority   string  `json:"priority"`
	WorkDir    string  `json:"work_dir"`
	CreatedAt  string  `json:"created_at"`
	UpdatedAt  string  `json:"updated_at"`
	ArchivedAt *string `json:"archived_at,omitempty"`
}

type Task struct {
	Slug               string   `json:"slug"`
	Name               string   `json:"name"`
	ProjectSlug        *string  `json:"project_slug,omitempty"`
	Status             string   `json:"status"`
	Kind               string   `json:"kind"`
	PlaybookSlug       *string  `json:"playbook_slug,omitempty"`
	Priority           string   `json:"priority"`
	WorkDir            string   `json:"work_dir"`
	WaitingOn          *string  `json:"waiting_on,omitempty"`
	DueDate            *string  `json:"due_date,omitempty"`
	Assignee           *string  `json:"assignee,omitempty"`
	StatusChangedAt    *string  `json:"status_changed_at,omitempty"`
	SessionID          *string  `json:"session_id,omitempty"`
	SessionStarted    *string  `json:"session_started,omitempty"`
	SessionLastResumed *string  `json:"session_last_resumed,omitempty"`
	CreatedAt          string   `json:"created_at"`
	UpdatedAt          string   `json:"updated_at"`
	ArchivedAt         *string  `json:"archived_at,omitempty"`
	Tags               []string `json:"tags"`
	Stale              bool     `json:"stale"`
}

type Playbook struct {
	Slug        string  `json:"slug"`
	Name        string  `json:"name"`
	ProjectSlug *string `json:"project_slug,omitempty"`
	WorkDir     string  `json:"work_dir"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
	ArchivedAt  *string `json:"archived_at,omitempty"`
}

type Workdir struct {
	Path        string  `json:"path"`
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
	GitRemote   *string `json:"git_remote,omitempty"`
	LastUsedAt  *string `json:"last_used_at,omitempty"`
	CreatedAt   string  `json:"created_at"`
}

type TagCount struct {
	Tag   string `json:"tag"`
	Count int    `json:"count"`
}
