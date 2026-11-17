import { courseFormat, type CourseFile, type SlideNode } from '../lib/course'
import { cppFoundation } from './cpp-foundation'

function node(id: string, parentId: string | null, title: string, content: string): SlideNode {
  return { id, parentId, title, content: content.trim() }
}

export const library: CourseFile[] = [
  cppFoundation,
  {
    format: courseFormat,
    version: 1,
    id: 'mail-project',
    title: 'Mail-Project',
    description: 'How the mail platform is organized, versioned, and shipped.',
    nodes: [
      node(
        'overview',
        null,
        'Project Overview',
        `
A mail workspace with a web client, a Django API, and browser automation.

Mail-Project is the repository for a mail product that talks to Gmail and LinkedIn. This lecture walks through how that repository is organized, and how Git keeps the history safe to change.

### Frontend

The web client. Built files land in \`frontend/dist\` and stay out of Git.

### Django backend

The API and local data. The virtualenv and database files belong to one machine.

### Automation

Playwright suites for Gmail, LinkedIn, Naukri, and the other browser flows.

### Docs and scripts

Setup notes, the task list, and helper scripts travel with the code.

> **Takeaway.** The repository is the source of truth for code and docs. Generated files, secrets, and browser profiles do not belong in history.
`,
      ),
      node(
        'git',
        null,
        'Version Control with Git',
        `
How Mail-Project is versioned: what Git stores, which files stay on one machine, and how a change reaches \`main\`.
`,
      ),
      node(
        'what-is-git',
        'git',
        '1. What is Git?',
        `
A distributed version control system that records snapshots of your project.

Git remembers a project as a series of snapshots. Each commit is a picture of the tracked files at that moment, plus a pointer to the snapshot before it.

### Working tree

The files you edit in the editor.

### Staging area

The changes you have chosen for the next snapshot.

### History

The commits already recorded, on this machine and on the remote.

### Branch

A movable name for one line of that history. This repo’s main line is \`main\`.

> **Tip.** Commit the change you can explain in one sentence. The history here starts with a subject like “Initial commit: Mail Project with Gmail/LinkedIn…”.

> **Takeaway.** Git is a local history first. You can review, branch, and undo before anything is shared.
`,
      ),
      node(
        'repository-basics',
        'git',
        '2. Repository Basics',
        `
Clone the project, see what changed, and know where Git keeps its data.

A repository is a project folder plus a hidden \`.git\` directory. The folder is the working tree. \`.git\` is the database of commits, branches, and configuration.

### Day to day

Check the branch, see which files changed, and decide what belongs in the next commit.

### A short loop

1. Edit files in the working tree.
2. Review them with \`git status\`.
3. Stage only what the commit should contain.

\`\`\`bash
git clone <repo-url> mail-project
cd mail-project
git status
git switch -c feature/inbox-filters
\`\`\`

> **Takeaway.** If a file matters to the next person who clones the repo, it belongs in a commit. If it only matters on your machine, it belongs in \`.gitignore\`.
`,
      ),
      node(
        'gitignore',
        'git',
        '3. .gitignore',
        `
Ignore unnecessary files in your Git repository.

A \`.gitignore\` file tells Git which files or folders to ignore, so they are not tracked.

### Common use cases

- Ignore build artifacts (\`dist/\`, \`build/\`)
- Ignore local environment files (\`.env\`)
- Ignore IDE files (\`.vscode/\`, \`.idea/\`)
- Ignore logs and temporary files (\`*.log\`, \`*.tmp\`)

\`\`\`gitignore
# Ignore environment files
.env
.env.worker

# Ignore frontend build
frontend/.env
frontend/.env.local
frontend/.env.production.local

# Ignore cache and logs
__pycache__/
*.py[cod]
*.db
data/*.db
\`\`\`

> **Tip.** Add rules in \`.gitignore\` before committing files, especially for generated or sensitive data.

> **Takeaway.** Use \`.gitignore\` to keep the repository clean and focused on source code.
`,
      ),
      node(
        'commits',
        'git',
        '4. Commits & History',
        `
A commit is a named snapshot with an author, a date, and a parent.

Write the message for the person reading \`git log\` six months from now, including you. One commit should be one logical change.

### What to record

The subject says why the change exists. The diff already says what moved.

### A useful subject

- Start with a verb: add, fix, update.
- Keep the first line short enough to read in a log.
- Name the area when it helps: “Ignore Playwright profiles”.

\`\`\`bash
git add .gitignore
git commit -m "Ignore local env files and build output"

git log --oneline --decorate -5
\`\`\`

> **Tip.** Look at the diff before you commit. \`git diff\` is the working tree. \`git diff --staged\` is exactly what the next commit will contain.

> **Takeaway.** History is part of the product. Small commits with honest subjects keep the Mail-Project log readable.
`,
      ),
      node(
        'branches',
        'git',
        '5. Branches & Merging',
        `
Keep main releasable, and do the experiment on a branch.

A branch is a pointer to a commit. Creating one is cheap, which is why feature work should not happen directly on \`main\`.

### main

The line you can deploy. It should build.

### Feature branch

A name for one change, for example \`feature/inbox-filters\`.

### Merge

Brings that line back. A merge commit keeps both parents.

### Review

Open a pull request so the diff is read before it lands on \`main\`.

\`\`\`bash
git switch main
git pull
git switch -c feature/inbox-filters

git push -u origin HEAD
\`\`\`

> **Takeaway.** Branch for the change, merge when it is ready, and leave \`main\` in a state you would deploy.
`,
      ),
      node(
        'structure',
        null,
        'Project Structure',
        `
The top-level folders tell you where a change belongs.

\`\`\`text
Mail-Project/
  backend/                 Django API and local data
  frontend/                Web client
  gmail-playwright/        Gmail browser flows
  linkedin-playwright/     LinkedIn browser flows
  naukri-playwright/
  leetcode-playwright/
  builtin-playwright/
  scripts/                 Helper scripts
  docs/                    Notes that travel with the code
  data/                    Local data, mostly gitignored
  .env.example             Names of settings, safe to commit
  README.md  SETUP.md     How to run the project
\`\`\`

### Source

\`backend/\`, \`frontend/\`, and \`scripts/\` are the product.

### Automation

Each Playwright suite keeps its own config, profiles, screenshots, and logs.

### Examples

\`.env.example\` and \`.env.worker.example\` document the variables a fresh clone needs.

### Local only

\`.env\`, \`node_modules/\`, \`.venv/\`, and \`*.db\` stay on the machine that created them.

> **Takeaway.** If you are unsure where a file goes, match the folder that already owns that kind of work.
`,
      ),
      node(
        'backend',
        null,
        'Django Backend',
        `
The API lives in \`backend/\`. The virtualenv and the database stay on your machine.

The backend is a Django project. Git tracks the source. It does not track the environment you create in order to run that source.

### What stays local

The virtualenv, bytecode, and database files are created on your machine. They are fast to rebuild and wrong to share.

### Ignored on purpose

- \`.venv/\` and \`venv/\` — the Python environment
- \`__pycache__/\` and \`*.py[cod]\` — bytecode
- \`*.db\` and \`data/*.db\` — local databases
- \`.env\` — secrets and machine-specific settings

\`\`\`bash
cd backend
python -m venv .venv
source .venv/bin/activate

# names are documented, values stay local
cp ../.env.example ../.env
\`\`\`

> **Tip.** Commit \`.env.example\` when you add a setting. Commit the value only when it is not a secret. For \`.env\`, it is a secret.

> **Takeaway.** The backend is reproducible from source plus an example env file. The virtualenv and the database are not part of the source.
`,
      ),
      node(
        'deployment',
        null,
        'Deployment',
        `
Ship source and configuration. Leave local secrets and build caches behind.

The repo carries \`vercel.json\` for the frontend host. Production configuration is injected by that host. \`.vercel/\` and \`frontend/.env.production.local\` are local links to it, so they are gitignored.

### Commit

Application source, \`vercel.json\`, and \`.env.example\`.

### Ignore

\`.vercel/\`, local env files, \`frontend/dist/\`, and \`*.tgz\` archives.

### Secrets

Set API keys in the host’s environment, not in a file that gets committed.

### Check

A fresh clone, plus the setup notes, should be enough to run the app.

> **Tip.** \`mail-project-secrets.tgz\` is ignored for a reason. An archive of secrets that lands in Git history is still in Git history.

> **Takeaway.** Deploy from a clean tree. If a file was generated on a laptop, the server should not need that copy.
`,
      ),
      node(
        'practices',
        null,
        'Best Practices',
        `
Small habits that keep the Mail-Project history trustworthy.

### Ignore before you add

Write the \`.gitignore\` rule first, then create the secret or the build folder.

### Examples, not secrets

\`.env.example\` lists names. \`.env\` holds values and stays untracked.

### Keep empty folders

Git does not track folders by themselves. A \`.gitkeep\` file holds the place.

### Negate a rule

A later \`!\` pattern puts back a file that a broader rule ignored.

\`\`\`gitignore
linkedin-playwright/data/*
!linkedin-playwright/data/.gitkeep
\`\`\`

> **Takeaway.** The ignore file is part of the design of the repo. Review it with the same care as application code.
`,
      ),
    ],
  },
  {
    format: courseFormat,
    version: 1,
    id: 'operating-systems',
    title: 'Operating Systems',
    description: 'Processes, scheduling, and memory.',
    nodes: [
      node(
        'introduction',
        null,
        'Introduction',
        `
What an operating system is, the shapes it takes, and the kernel that talks to the hardware.
`,
      ),
      node(
        'what-is-an-os',
        'introduction',
        'What is an OS?',
        `
System software that manages hardware and offers services to programs.

An operating system sits between applications and the machine. Programs ask it for CPU time, memory, files, and devices instead of driving the hardware themselves.

### Process management

Creates processes, schedules them, and keeps them from corrupting one another.

### Memory management

Gives each process an address space and moves data between RAM and disk.

### File management

Names, stores, and protects persistent data.

### Device management

Shares disks, networks, and other devices through drivers.

> **Takeaway.** An operating system is a resource manager and a cleaner interface to the hardware.
`,
      ),
      node(
        'types-of-os',
        'introduction',
        'Types of OS',
        `
The same job, shaped by who is waiting and what happens if a deadline is missed.

| Type | Best use | Tradeoff |
| --- | --- | --- |
| Batch | Long jobs with nobody waiting at a keyboard | Simple scheduling, poor interactivity |
| Time-sharing | Many people on one machine | Each user gets a short slice of the CPU |
| Real-time | Control systems and hard deadlines | Predictable latency matters more than throughput |
| Desktop and mobile | One person, many apps | Strong isolation, and aggressive power saving |

> **Tip.** When you compare operating systems, ask who is waiting and what a late answer costs.

> **Takeaway.** The type of an operating system is a statement about its scheduling and isolation goals.
`,
      ),
      node(
        'kernel',
        'introduction',
        'Kernel',
        `
The part of the operating system that runs with full access to the hardware.

User programs run in user mode. When they need a privileged action — reading a disk, creating a process, sending a packet — they make a system call and trap into the kernel.

| Approach | Idea | Best use |
| --- | --- | --- |
| Monolithic | File systems, drivers, and scheduling share the kernel address space | Fewer crossings between user and kernel |
| Microkernel | The kernel keeps scheduling, memory, and IPC. Other services are processes | A smaller trusted core |
| Hybrid | A microkernel shape with more services pulled back into the kernel | Practical desktop and mobile systems |

> **Takeaway.** The kernel is the trusted core. Everything else reaches the hardware through it.
`,
      ),
      node(
        'processes',
        null,
        'Process Management',
        `
A process is a program in execution. The operating system records it, pauses it, and resumes it.
`,
      ),
      node(
        'process-states',
        'processes',
        'Process states',
        `
A process spends its life moving between a few states.

New → Ready → Running → Terminated. A running process that needs input or output leaves the CPU and waits. When that event finishes, the process becomes ready again and waits for another turn.

### New

The operating system is still creating the process.

### Ready

It can run. It is waiting in the ready queue for the scheduler.

### Running

Its instructions are executing on a CPU right now.

### Waiting

It cannot run until some event, often I/O, completes.

> **Takeaway.** Only a running process executes instructions. The rest of the life cycle is the scheduler and I/O moving it between queues.
`,
      ),
      node(
        'pcb',
        'processes',
        'PCB',
        `
Everything the operating system must remember in order to pause a process and resume it.

The process control block, or PCB, is the record of one process. Switching away means saving this record. Switching back means loading it.

### Identity

Process id, parent, owner, and the current state.

### CPU context

Program counter, general registers, and the stack pointer.

### Memory

Pointers to the page tables that describe its address space.

### Accounting

CPU time used, scheduling priority, and the list of open files.

> **Takeaway.** If a fact must survive a context switch, it lives in the PCB.
`,
      ),
      node(
        'context-switching',
        'processes',
        'Context switching',
        `
The CPU stops one process and resumes another. The switch itself is overhead.

### What the switch does

1. Save the running process’s registers into its PCB.
2. Choose the next process from the ready queue.
3. Load that process’s registers and address space.
4. Jump to its saved program counter.

None of those steps is the program’s own work. A scheduler that switches constantly, or a workload that blocks on every small I/O, spends real time here.

> **Tip.** Context-switch cost is why a policy that looks faster on paper can lose if it switches too often.

> **Takeaway.** A context switch spends CPU time to keep the illusion that many processes run at once.
`,
      ),
      node(
        'scheduling',
        null,
        'CPU Scheduling',
        `
Schedulers are judged by how long work waits, and by how fairly the CPU is shared.

For one job, turnaround time is how long it stays in the system. Waiting time is the part of that spent off the CPU.

$$
T_{turnaround} = T_{completion} - T_{arrival}
$$

$$
T_{waiting} = T_{turnaround} - T_{burst}
$$

| Policy | Idea | Favors |
| --- | --- | --- |
| FCFS | Run in arrival order | Simple fairness. A long job can block short ones |
| SJF | Shortest CPU burst next | Short jobs. It needs an estimate of the next burst |
| Round robin | A fixed time slice, then the next ready job | Interactive response |
| Priority | The highest-priority ready job runs | Important work. Low-priority jobs can starve |

> **Takeaway.** Choose the policy from the kind of waiting you can tolerate. No scheduler wins every column.
`,
      ),
      node(
        'memory',
        null,
        'Address spaces',
        `
Each process sees a private range of addresses. The hardware maps those addresses onto real memory.

Virtual memory gives every process the same story: a private address space that starts low and grows as the process asks for more. Two processes can both use the address \`0x4000\` and mean different physical frames.

### Page

A fixed-size block of a process’s virtual address space.

### Frame

A physical block of RAM the same size as a page.

### Page table

The per-process map from pages to frames.

### Fault

A reference to a page that is not in RAM. The OS fetches it and retries the instruction.

> **Takeaway.** Isolation, and the ability to run a program larger than physical memory, both come from this mapping.
`,
      ),
    ],
  },
]
