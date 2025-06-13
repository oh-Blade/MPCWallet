package mpc

import (
	"sync"
	"time"
)

type SessionStatus string

const (
	SessionPending   SessionStatus = "pending"
	SessionActive    SessionStatus = "active"
	SessionCompleted SessionStatus = "completed"
)

type Session struct {
	ID         string        `json:"id"`
	Creator    string        `json:"creator"`
	Members    []string      `json:"members"`
	Status     SessionStatus `json:"status"`
	CreatedAt  time.Time     `json:"created_at"`
	UpdatedAt  time.Time     `json:"updated_at"`
	InviteData string        `json:"invite_data"`
}

type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*Session
}

func NewSessionStore() *SessionStore {
	return &SessionStore{
		sessions: make(map[string]*Session),
	}
}

func (s *SessionStore) CreateSession(creator, inviteData string) *Session {
	s.mu.Lock()
	defer s.mu.Unlock()
	id := generateSessionID()
	sess := &Session{
		ID:         id,
		Creator:    creator,
		Members:    []string{creator},
		Status:     SessionPending,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
		InviteData: inviteData,
	}
	s.sessions[id] = sess
	return sess
}

func (s *SessionStore) JoinSession(id, member string) (*Session, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	sess, ok := s.sessions[id]
	if !ok {
		return nil, false
	}
	for _, m := range sess.Members {
		if m == member {
			return sess, true
		}
	}
	sess.Members = append(sess.Members, member)
	sess.UpdatedAt = time.Now()
	if len(sess.Members) >= 2 {
		sess.Status = SessionActive
	}
	return sess, true
}

func (s *SessionStore) GetSession(id string) (*Session, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	sess, ok := s.sessions[id]
	return sess, ok
}

// 生成唯一SessionID（可用UUID库替换）
func generateSessionID() string {
	return time.Now().Format("20060102150405.000000")
}
