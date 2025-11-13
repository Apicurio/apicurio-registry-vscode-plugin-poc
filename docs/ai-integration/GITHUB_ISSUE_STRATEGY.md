# GitHub Issue Management Strategy

**Issue:** #1 - MCP Integration Issues

---

## Recommended Approach: Update & Keep Open ✅

**Action:** Update Issue #1 with corrected analysis, keep it OPEN

**Why this is best:**
1. ✅ Maintains issue history (shows investigation journey)
2. ✅ Keeps all context and discussion in one place
3. ✅ Better for future reference and learning
4. ✅ Follows GitHub best practices (correct, don't close)
5. ✅ Issue is NOT fully resolved (plugin still needs improvements)

---

## What to Do

### 1. Update Issue Title

**Current:**
```
[BUG] Claude Code v2.0.31 stdio Connection Drops After ~20 Seconds
```

**New:**
```
[BUG] MCP Integration: Docker/Podman Environment Variables Not Reaching Container
```

### 2. Update Labels

**Remove:**
- `claude-code-bug` (it's not a Claude Code bug)

**Add:**
- `bug` (keep)
- `configuration`
- `documentation`
- `workaround-available`

### 3. Post Update Comment

Copy content from: `GITHUB_ISSUE_UPDATE_COMMENT.md`

**Key sections in comment:**
- 🔄 Correction notice (original hypothesis was wrong)
- 🔍 Actual root cause (env object vs inline -e flags)
- ✅ The solution (with examples)
- 🧪 Verification tests (proof it works)
- 🤔 Why nobody else reported it
- 📊 Impact (before/after)
- 🛠️ Step-by-step fix instructions
- 💡 Lessons learned

### 4. Keep Issue OPEN

**Reason:** The issue is **partially resolved**

**What's FIXED:** ✅
- Configuration workaround available
- MCP server works correctly
- Documentation updated

**What's NOT FIXED:** ⏳
- Plugin still generates broken config with `--env` flag
- No warning about env limitation with containers
- Setup wizard doesn't auto-detect best execution mode
- No JAR/jbang execution mode support

---

## Alternative Approach: Close & Create New (NOT Recommended)

**Action:** Close #1, create new issue

**Why NOT recommended:**
1. ❌ Loses investigation history
2. ❌ Splits discussion across multiple issues
3. ❌ Harder to track for future contributors
4. ❌ Looks like we gave up on original issue
5. ❌ Doesn't show the learning/debugging process

**Only do this if:**
- Original issue is completely unrelated to actual problem (not the case here)
- Original issue needs to be hidden for security reasons (not the case)
- Too much noise/spam in original issue (not the case)

---

## Issue Timeline (For Context)

### Original Issue (Incorrect Hypothesis)
**Reported:** 2025-11-XX
**Problem:** "Claude Code stdio connection drops after ~20 seconds"
**Blamed:** Claude Code bug
**Evidence:** Debug logs showing connection drops

### Investigation Phase
**Date:** 2025-11-11
**Duration:** ~4 hours
**Actions:**
- Manual MCP protocol testing
- Docker/Podman environment variable testing
- Claude Code log analysis
- Comparison with other Quarkus MCP servers
- Web research on similar issues

### Root Cause Discovery
**Date:** 2025-11-11
**Finding:** Environment variables not reaching container
**Cause:** `--env` flag only sets vars for host command, not container
**Proof:** Standalone tests with inline `-e` flags work perfectly

### Resolution Phase (Partial)
**Date:** 2025-11-11
**Workaround:** Use inline `-e` flags instead of `--env`
**Status:** Configuration fixed, plugin needs updates

---

## Tracking Future Work

**Create new issues for plugin improvements:**

### Issue #2: Warn about `--env` limitation with containers
```markdown
**Title:** [Enhancement] Warn users when using --env flag with Docker/Podman

**Description:**
The `--env` flag in `claude mcp add` doesn't pass environment variables
to Docker/Podman containers. We should detect containerized execution
and warn users to use inline `-e` flags instead.

**Related:** #1
**Priority:** High
**Labels:** enhancement, ux-improvement
```

### Issue #3: Add JAR/jbang execution modes
```markdown
**Title:** [Feature] Support JAR and jbang execution modes for MCP server

**Description:**
Currently, the plugin only supports Docker/Podman execution. Add support for:
1. Direct JAR execution: `java -jar mcp-server.jar`
2. jbang execution: `jbang mcp-server@registry`

**Benefits:**
- Simpler configuration (no Docker networking)
- Access to Quarkus Dev UI
- Faster startup times
- Matches official quarkiverse examples

**Related:** #1
**Priority:** Medium
**Labels:** enhancement, feature
```

### Issue #4: Auto-detect execution mode in Setup Wizard
```markdown
**Title:** [Enhancement] Setup Wizard should auto-detect and recommend execution mode

**Description:**
The Setup Wizard should detect available runtimes and recommend the best option:
1. Check for Java installation
2. Check for jbang installation
3. Check for Docker/Podman installation
4. Recommend in order: jbang > JAR > Docker

**Related:** #1
**Priority:** Medium
**Labels:** enhancement, ux-improvement
```

---

## Documentation Updates Needed

**Files to update:**
- ✅ `ROOT_CAUSE_ANALYSIS.md` - Created
- ✅ `GITHUB_ISSUE_UPDATE_COMMENT.md` - Created
- ✅ `GITHUB_ISSUE_TEMPLATE_FINAL.md` - Created
- ⏳ `GETTING_STARTED.md` - Add warning about --env flag
- ⏳ `README.md` - Update troubleshooting section
- ⏳ `TODO.md` - Add new tasks for plugin improvements

---

## Communication Plan

### On GitHub
1. Post update comment on Issue #1
2. Update issue title
3. Update labels
4. Keep issue OPEN
5. Create follow-up issues (#2, #3, #4)

### In Documentation
1. Update all setup guides with warning
2. Add troubleshooting section for env vars
3. Document the investigation for future reference

### For Users
1. Notify in Release Notes (next version)
2. Add migration guide for existing users
3. Update Setup Wizard with warning

---

## Success Metrics

**Issue #1 will be considered CLOSED when:**
- [ ] Plugin detects containerized execution
- [ ] Plugin warns about `--env` limitation
- [ ] Setup Wizard recommends best execution mode
- [ ] JAR/jbang execution modes available
- [ ] Documentation fully updated
- [ ] All related issues (#2, #3, #4) closed

---

## Estimated Timeline

**Immediate (Done):**
- ✅ Root cause identified
- ✅ Configuration workaround available
- ✅ Documentation created

**Short-term (1-2 weeks):**
- ⏳ Post update comment on Issue #1
- ⏳ Create follow-up issues (#2, #3, #4)
- ⏳ Update all documentation

**Medium-term (1 month):**
- ⏳ Implement env warning (Issue #2)
- ⏳ Add JAR execution mode (Issue #3)
- ⏳ Update Setup Wizard (Issue #4)

**Long-term (2-3 months):**
- ⏳ Add jbang execution mode
- ⏳ Full testing and release
- ⏳ Close Issue #1

---

## Decision Matrix

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Update & Keep Open** | ✅ History preserved<br>✅ Context maintained<br>✅ Shows investigation<br>✅ Issue not fully resolved | ⚠️ Longer issue thread | ⭐ **RECOMMENDED** |
| **Close & Create New** | ✅ Clean slate<br>✅ Correct title from start | ❌ Loses history<br>❌ Splits discussion<br>❌ Looks abandoned | ❌ Not recommended |
| **Close as Resolved** | ✅ Simple | ❌ Issue not actually resolved<br>❌ Plugin still needs work<br>❌ Misleading | ❌ Incorrect |

---

**Recommendation:** Update Issue #1 with corrected analysis and keep it OPEN

**Reason:** Issue is only partially resolved - configuration workaround exists, but plugin improvements are still needed.
