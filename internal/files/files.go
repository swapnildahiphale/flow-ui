package files

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

// Reader resolves paths under ~/.flow/ for an entity and reads files safely.
// All read paths are rooted under Root and contain no .. traversal.
type Reader struct {
	Root string // absolute path to ~/.flow/  (or its override)
}

type Update struct {
	Filename string `json:"filename"`
	Date     string `json:"date"`     // YYYY-MM-DD parsed from filename prefix
	Title    string `json:"title"`    // kebab portion of filename (after the date) humanized
	Body     string `json:"body"`     // raw markdown
}

type KBFile struct {
	Name     string `json:"name"`     // user | org | products | processes | business
	Path     string `json:"path"`
	Mtime    string `json:"mtime"`    // RFC3339
	Size     int64  `json:"size"`
	Entries  int    `json:"entries"`  // counted as "^- " lines
}

var ErrNotFound = errors.New("file not found")
var updateFilenameRe = regexp.MustCompile(`^(\d{4}-\d{2}-\d{2})-(.+)\.md$`)

// Brief returns the markdown body of an entity's brief.md.
// kind ∈ {"tasks","projects","playbooks"}; slug is the entity slug.
func (r *Reader) Brief(kind, slug string) (string, error) {
	if err := validateSlug(slug); err != nil {
		return "", err
	}
	if !isKnownKind(kind) {
		return "", fmt.Errorf("unknown kind %q", kind)
	}
	p := filepath.Join(r.Root, kind, slug, "brief.md")
	b, err := os.ReadFile(p)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return "", ErrNotFound
		}
		return "", err
	}
	return string(b), nil
}

// Updates lists update files for an entity, newest first.
func (r *Reader) Updates(kind, slug string) ([]Update, error) {
	if err := validateSlug(slug); err != nil {
		return nil, err
	}
	if !isKnownKind(kind) {
		return nil, fmt.Errorf("unknown kind %q", kind)
	}
	dir := filepath.Join(r.Root, kind, slug, "updates")
	entries, err := os.ReadDir(dir)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return []Update{}, nil
		}
		return nil, err
	}
	var out []Update
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := updateFilenameRe.FindStringSubmatch(e.Name())
		if m == nil {
			continue
		}
		body, err := os.ReadFile(filepath.Join(dir, e.Name()))
		if err != nil {
			return nil, err
		}
		out = append(out, Update{
			Filename: e.Name(),
			Date:     m[1],
			Title:    strings.ReplaceAll(m[2], "-", " "),
			Body:     string(body),
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Filename > out[j].Filename })
	return out, nil
}

// KBList lists the 5 canonical KB files with metadata.
func (r *Reader) KBList() ([]KBFile, error) {
	names := []string{"user", "org", "products", "processes", "business"}
	out := make([]KBFile, 0, len(names))
	for _, n := range names {
		p := filepath.Join(r.Root, "kb", n+".md")
		st, err := os.Stat(p)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				continue
			}
			return nil, err
		}
		b, err := os.ReadFile(p)
		if err != nil {
			return nil, err
		}
		entries := 0
		for _, line := range strings.Split(string(b), "\n") {
			if strings.HasPrefix(strings.TrimSpace(line), "- ") {
				entries++
			}
		}
		out = append(out, KBFile{
			Name:    n,
			Path:    p,
			Mtime:   st.ModTime().UTC().Format("2006-01-02T15:04:05Z"),
			Size:    st.Size(),
			Entries: entries,
		})
	}
	return out, nil
}

// KBRead returns the body of a single KB file.
func (r *Reader) KBRead(name string) (string, string, error) {
	if !isKnownKB(name) {
		return "", "", ErrNotFound
	}
	p := filepath.Join(r.Root, "kb", name+".md")
	b, err := os.ReadFile(p)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return "", "", ErrNotFound
		}
		return "", "", err
	}
	st, _ := os.Stat(p)
	return string(b), st.ModTime().UTC().Format("2006-01-02T15:04:05Z"), nil
}

// AllUpdates walks every task/project/playbook updates directory and returns
// updates flattened, newest first. Used by the timeline endpoint.
func (r *Reader) AllUpdates() ([]TimelineEntry, error) {
	out := []TimelineEntry{}
	for _, kind := range []string{"tasks", "projects"} {
		root := filepath.Join(r.Root, kind)
		entries, err := os.ReadDir(root)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				continue
			}
			return nil, err
		}
		for _, slugDir := range entries {
			if !slugDir.IsDir() {
				continue
			}
			ups, err := r.Updates(kind, slugDir.Name())
			if err != nil {
				return nil, err
			}
			for _, u := range ups {
				out = append(out, TimelineEntry{
					Kind:     kind,
					Slug:     slugDir.Name(),
					Filename: u.Filename,
					Date:     u.Date,
					Title:    u.Title,
					Body:     u.Body,
				})
			}
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Date != out[j].Date {
			return out[i].Date > out[j].Date
		}
		return out[i].Filename > out[j].Filename
	})
	return out, nil
}

type TimelineEntry struct {
	Kind     string `json:"kind"` // "tasks" | "projects"
	Slug     string `json:"slug"`
	Filename string `json:"filename"`
	Date     string `json:"date"`
	Title    string `json:"title"`
	Body     string `json:"body"`
}

func validateSlug(s string) error {
	if s == "" || strings.Contains(s, "/") || strings.Contains(s, "..") {
		return fmt.Errorf("invalid slug %q", s)
	}
	return nil
}

func isKnownKind(k string) bool {
	return k == "tasks" || k == "projects" || k == "playbooks"
}

func isKnownKB(n string) bool {
	switch n {
	case "user", "org", "products", "processes", "business":
		return true
	}
	return false
}
