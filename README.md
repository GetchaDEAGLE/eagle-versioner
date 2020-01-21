<p align="center">
  <img alt="Eagle Versioner" src="https://github.com/GetchaDEAGLE/eagle-versioner/blob/master/documentation/images/ev-logo.png" width="274pt" height="210pt" />
</p>

---

<p align="center">
  <img alt="Latest Version" src="https://img.shields.io/npm/v/eagle-versioner?style=flat-square" />
  <a href="https://actions-badge.atrox.dev/GetchaDEAGLE/eagle-versioner/goto?ref=master">
    <img alt="Build Status" src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2FGetchaDEAGLE%2Feagle-versioner%2Fbadge%3Fref%3Dmaster&style=flat-square" />
  </a>
  <a href="https://coveralls.io/github/GetchaDEAGLE/eagle-versioner?branch=master">
    <img alt="Coverage status" src="https://img.shields.io/coveralls/github/GetchaDEAGLE/eagle-versioner/master?style=flat-square" />
  </a>
  <a href="https://david-dm.org/GetchaDEAGLE/eagle-versioner">
    <img alt="Dependency status" src="http://img.shields.io/david/GetchaDEAGLE/eagle-versioner?style=flat-square" />
  </a>
  <a href="https://david-dm.org/GetchaDEAGLE/eagle-versioner#info=devDependencies">
    <img alt="Dev Dependencies status" src="http://img.shields.io/david/dev/GetchaDEAGLE/eagle-versioner?style=flat-square" />
  </a>
  <a href="https://www.npmjs.org/package/eagle-versioner">
    <img alt="NPM Status" src="http://img.shields.io/npm/dm/eagle-versioner?style=flat-square" />
  </a>
  <a href="https://www.danieleagle.com" target="_blank">
    <img alt="Web" src="https://img.shields.io/badge/Web-danieleagle.com-blue?style=flat-square" />
  </a>
  <a href="https://paypal.me/GetchaDEAGLE" target="_blank">
    <img alt="Donate" src="https://img.shields.io/badge/donate-paypal-purple?style=flat-square" />
  </a>
</p>

Eagle Versioner is a powerful semantic versioning tool inspired by
[Angular's Commit Message Convention](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)
to calculate the version based on the changes made to the repository. It closely follows the
[Semantic Versioning Specification](https://semver.org/) created by [Tom Preston-Werner](http://tom.preston-werner.com/).

---

## Table of Contents

1. [Installation](#installation)
2. [Main Features](#main-features)
3. [Change Types](#change-types)
4. [Version Commit](#version-commit)
5. [Versioning Strategies](#versioning-strategies)
6. [Development Appendages](#development-appendages)
7. [Logging Levels](#logging-levels)
8. [Breaking Changes](#breaking-changes)
9. [Handling an Initial Commit](#handling-an-initial-commit)
10. [Multiple Production Branches](#multiple-production-branches)
11. [Changelog Generation](#changelog-generation)
12. [Merging Changes from Other Branches](#merging-changes-from-other-branches)
13. [CLI Help Output](#cli-help-output)
14. [Usage Example](#usage-example)
15. [Versioning Automation](#versioning-automation)
16. [Docker Image Tagging](#docker-image-tagging)
17. [Skipping CICD Pipeline Job Trigger](#skipping-cicd-pipeline-job-trigger)
18. [Issues and Feature Requests](#issues-and-feature-requests)
19. [Donations](#donations)
20. [Latest Changes](#latest-changes)
21. [More from the Author](#more-from-the-author)
22. [Copyright/License Notice](#copyrightlicense-notice)

## Installation

For best results, Eagle Versioner should be installed as a global package so the main **ev** command can be invoked from anywhere
in the terminal.

```bash
npm install -g eagle-versioner
```

## Main Features

There are three main features which make up the tool, all provided by a simple CLI.

* **Version Calculation** - Calculates the semantic version by looking at commit message history for commits inspired by
the Angular Commit Message Convention.

* **Changelog Creation** - Creates a changelog based on the commit message history. Only shows changes affecting the
version.

* **Specialized Commit Creation** - Provides a mechanism for creating commits based on the desired change type. Enforces
a custom implementation of the Angular Commit Message Convention by allowing the user to pick from a list of change types
and entering the desired message while ensuring the commit message is formatted correctly. It also offers an option to
check spelling (interactive mode only).

## Change Types

* **Bug Fix (causes version change)** - It's fun squashing bugs.
* **Changelog** - Updating the changelog for project visibility.
* **Chore** - Generic chore that doesn't fall in another change type.
* **Doc** - Documentation to keep stakeholders happy.
* **Feature (causes version change)** - Something new and shiny was added.
* **Perf (causes version change)** - The application is performing way better now.
* **Refactor** - For refactoring code but not adding new functionality.
* **Styling** - Fixing ugly code (spaces are better than tabs).
* **Test** - The addition of tests (e.g. unit tests, integration tests, etc.).
* **Version Change** - Updates to the file(s) containing version information.

## Version Commit

It is important to understand that the **Version Change** type creates a commit with version information which is important
data used by Eagle Versioner. When calculating the version, only commit history after the last production version change
commit will be obtained. This is for optimization purposes; if no production version commits exist then the entire
commit history would need to be obtained and depending on the size of the repository, could have a negative impact on
performance.

In addition, the version change commit is used in the changelog creation process. In order to categorize certain commits
under the correct version, the version change commit is needed. If no version change commits existed then the generated
changelog would be missing relevant version information to identify what version the changes belong to.

Even if no version change commits existed, the version calculation process would still work but not optimally. Therefore,
it is highly recommended to create version change commits by selecting the **Version Change** type option when using the
**ev commit** command. This is demonstrated in the [usage example](#usage-example).

**Note:** The only exception requiring version change commits is during initial development. In that case, the only way
to advance the version is to create a version change commit. Then after adding some more changes and running the
`ev calculate` command, the version will be incremented.

## Versioning Strategies

The default versioning strategy for Eagle Versioner is **sequential**. With this strategy, each applicable commit will
be analyzed incrementally. If the commit affects the version, the associated version subset (e.g. major.minor.patch)
will be updated.

Conversely, the optional **collective** versioning strategy will analyze applicable contiguous commits of types which
affect the same version subset and count those commits together as one change. For example, if three contiguous commits
are for bug fixes, the patch version would only be incremented by one. In contrast, the sequential versioning strategy
would increment the patch version by three.

**Note:** The only exception for the **collective** versioning strategy is a breaking change which will always cause the
major version to increment and the remaining minor and patch versions set to zero. Regardless of being contiguous, these
breaking change commits will not be counted as one change.

## Development Appendages

Upon calculating the version, the type of branch that is currently checked out will determine whether any appendage is
added after the version. For example, if it is detected that a development branch is currently checked out, by default
it will append the name of the branch (e.g. **1.2.3-latest**). In addition, there is also an option to append snapshot
(e.g. **1.2.3-SNAPSHOT**) to accommodate Maven.

Only development branches will trigger the appendage to appear after the version. Production branches such as **master**
are intended to be release-ready code that can safely run in production. As such, no appendage is added in order to clearly
distinguish between a production or development version. This is the only area where Eagle Versioner deviates from the
Semantic Versioning Specification.

## Logging Levels

By default, only relevant output to the current command will be displayed in the terminal. This represents the **INFO**
logging level. However, it is possible to switch to a different logging level to get more or less information. The
available logging levels are **INFO**, **DEBUG**, **WARNING**, **ERROR**, **VERBOSE**, and **SILENT**.

## Breaking Changes

Per the [Semantic Versioning Specification](https://semver.org/), when backward compatibility with the Public API has been
broken, the major version is incremented. Eagle Versioner refers to this as a **Breaking Change**. Since this can occur
in a variety of circumstances, the `ev commit` command will always ask if the commit is a breaking change. If it's a
breaking change, the major version will always be incremented regardless of the change type.

## Handling an Initial Commit

There are situations where the application is already at a release-ready version and needs to be pushed to the applicable
branch on the repository. In this context the repository will not yet contain any branches or commits due to the source
code either being migrated from a different source control system or the lack of a source control system at all (not a
good idea but a possible situation).

Rather than rewind the clock and attempt to create disparate commits with applicable messages for the existing code, all
code can be lumped together into one commit referred to as an **Initial Commit**. However, creating an Initial Commit
should only be reserved for this instance. Outside of this situation, disparate commits are necessary for each applicable
change in order to properly use Eagle Versioner.

In order to create an Initial Commit, all applicable source code should be staged, the **Version Change** type selected,
the option specified to indicate the change is for an Initial Commit (only applicable to the Version Change type), and
the proper version entered when prompted (e.g. 1.0.0 for a production branch or 0.1.0-<APPENDAGE_TYPE> for a development
branch). This will ensure the only commit is a version change commit which will later be used for calculating future
versions.

**Note:** An Initial Commit can only be created once. Also, the creation of an Initial Commit will fail if the current
branch already has commits. Therefore, an Initial Commit is intended as the first commit to seed the branch with existing
code which encompasses several features.

## Multiple Production Branches

By design, Eagle Versioner should only be used with one production branch (usually **master**). This production branch
should always represent code that is considered releasable with the highest quality. It is understandable to have multiple
development branches at any given time and Eagle Versioner fully supports independent versioning of each branch.

However, after these branches are eventually merged and then pushed to the production branch, when calculating the
production version, only the last production version change commit will be used (this is also true when calculating a
development version). That means if multiple production version change commits end up getting merged out of order, only
the most recent production version change commit will be used and everything else skipped. This could lead to unintended
results so it's not recommended to use more than one production branch.

In contrast, even if multiple development version change commits exist in the branch after a merge and are out of order,
it will have no impact on the calculated production version for reasons mentioned above. This too is by design so that
multiple disparate development versions can exist which is a common requirement.

Finally, if multiple production version change commits are found in the production branch that are out of order, the
generated changelog will also show these out of order versions. Again, this is why using only one production branch is
recommended.

**Note:** If the need for multiple production branches exists, perhaps it's best to create a fork and continue with
development as two separate projects.

## Changelog Generation

It is important to understand how the changelog is generated by Eagle Versioner in order to understand how it includes
versions along with the changes belonging to them.

### Changelog Generation for Production Branch

In the production branch (e.g. **master**), the generated changelog will aggregate all found development versions from
the detected version change commits and include them as a part of the latest production version.

For example, the production branch is at version **1.0.0** and the development branch is at **1.1.2-latest**. When the
development branch is merged with the production branch, a new version change commit is created to bring the production
version to **1.1.2**. After this has been done, the generated changelog will transfer ownership of commits belonging to
**1.1.2-latest** to **1.1.2**. This is because these commits now make up the new production version.

### Changelog Generation for Development Branch

In the development branch, the generated changelog will show all production versions along with their changes and the
latest development versions after the last production version, again with their changes. In situations where multiple
development branches end up getting merged into another development branch, it is likely multiple mismatching or out of
order development version change commits now exist. Eagle Versioner will generate the changelog and keep the order of
these development version change commits intact.

It is important to understand which commits are a part of which version during the development process, especially if
multiple changes are merged from other branches on a regular basis. However, it is important to only merge changes from
other branches either before starting work on new changes since the last version or after. For example, commits are
made to the current branch but no version change commit has been made after to properly identify these changes as being
part of the current branch. Then, when changes from another branch are merged into the current branch, any commits made
in the current branch prior to the merge will now appear to belong to the next version - the most recent version change
commit (closest to the last commit before the merge) coming from the merged branch.

## Merging Changes from Other Branches

After changes are merged from other branches it is recommended to make a version change commit with the new calculated
version. Any changes coming from another branch should be considered to belong to the current branch. This will also
ensure the most recent version found in the current changelog matches up to the most recent version applicable to the
current branch.

When calculating the version, Eagle Versioner will ignore development version change commits merged from other
branches in order to accommodate the idea that merged changes now belong to the current branch and should be used to
calculate the version applicable to the current branch.

## CLI Help Output

**Note:** The below commands will only work when the current folder that's been navigated to (via the terminal, shell,
etc.) contains a Git repository. Therefore, switch to the applicable folder before running these commands.

```bash
Usage: ev [options] [command]

From the creation of special commits, calculates the semantic version based on the Git branch and commit history.

Options:
  -v, --version        output the version number
  -h, --help           output usage information

Commands:
  calculate [options]  Calculates the version based on the information provided by Git.
  commit [options]     Creates a special commit later used when calculating the version.
  changelog [options]  Creates the changelog file from versionable commits.
```

```bash
Usage: ev calculate [options]

Calculates the version based on the information provided by Git.

Options:
  --dev-appendage <appendageType>       the type of dev version appendage (default: "branch_name")
  --logging-level <loggingLevelTarget>  the logging level target (default: "info")
  --prod-branch <branchName>            the name of the production branch (default: "master")
  --strategy <strategyType>             the type of versioning strategy (default: "sequential")
  -h, --help                            output usage information
```

```bash
Usage: ev changelog [options]

Creates the changelog file from versionable commits.

Options:
  --directory <dir>                     the name of the changelog directory (default: current working directory)
  --filename <fileName>                 the name of the changelog file (default: "CHANGELOG.md")
  --prod-branch <branchName>            the name of the production branch (default: "master")
  --logging-level <loggingLevelTarget>  the logging level target (default: "info")
  -h, --help                            output usage information
```

```bash
Usage: ev commit [options]

Creates a special commit later used when calculating the version.

Options:
  --manual                              option to skip interactive commit menu and specify options manually [disables spell checker]
  --change-type <changeType>            the type of change
  --short-msg <shortMsg>                the required short message belonging to the commit [ignored for the version_change type] (60 chars max)
  --long-msg <longMsg>                  the optional long message belonging to the commit [ignored for the version_change type] (512 chars max)
  --is-breaking                         indicates if the commit is a breaking change (default: false)
  --is-initial-commit                   indicates if the change is for an initial commit [required for the version_change type] (default: false)
  --insert-skip-ci-tag                  inserts the [ci-skip] tag in the commit message (default: false)
  --new-version <newVersion>            the new version [required for the version_change type]
  --prod-branch <branchName>            the name of the production branch (default: master)
  --dev-appendage <appendageType>       the type of dev version appendage [required for the version_change type] (default: branch_name)
  --strategy <strategyType>             the type of versioning strategy [required for the version_change type] (default: sequential)
  --logging-level <loggingLevelTarget>  the logging level target (default: info)
  -h, --help                            output usage information
```

## Usage Example

Before creating a release, the application will have an initial development version. Per the
[Semantic Versioning Specification](https://semver.org/) that version will start at **0.1.0** and each release prior to
the **1.0.0** production release will only increment the minor version.

Once a production release has been made and active development continues, the version will change to **1.0.0-latest**
with the major, minor, and patch versions being incremented depending upon the changes found.

For a complete understanding, see the example steps below.

1. Create a Git repository by running `git init` in the desired folder.

2. Create the desired development branch and switch to it by running `git checkout -b latest`. Replace **lastest** with
the desired branch name.

3. Perform development tasks and for each change run `git add .` to stage the change(s); this will add all unstaged files.
However, use `git add <FILE_NAME>` to only add specific files. To see the status of staged/unstaged files, use the
`git status` command. [See this](https://git-scm.com/docs/git-add) for complete documentation on the `git add` command.

    **Note:** It is generally a good idea to stage the file(s) associated with one type of change instead of bundling
    all changes together. As a best practice, plan on one commit per change type (e.g. stage file(s) for a disparate
    change, commit them, and then move on to the next change). This provides an accurate version depiction.

4. Run the command `ev commit` to bring up the interactive commit menu and select the applicable change type. In this
example, the feature change type is selected. Enter a short commit message which will serve as the header which briefly
describes the change. If more details are needed, add them to the optional long commit message. This information will go
directly under the short commit message and can bee seen by reviewing the Git log.

   **Note**: There will be a prompt for specifying whether the change is breaking. However, this will not affect the
   initial development version as it would other version types (e.g. regular development and production). Only specify
   a breaking change if it truly is and keep in mind indicating this is important information that can help other
   developers. More information on breaking changes can be [found here](#breaking-changes).
   
   In addition, there will be another prompt asking whether to insert the **[ci-skip]** tag. Please
   [see this](#skipping-cicd-pipeline-job-trigger) for more information.

   <img alt="EV Commit Menu" src="https://github.com/GetchaDEAGLE/eagle-versioner/blob/master/documentation/images/ev-commit-menu.png" />
   
5. (optional) Calculate the initial development version by running `ev calculate`. The output received is **0.1.0-latest**.
This command is generally used to get the version when the interactive mode of the `ev commit` command isn't possible. In
this case the output can be sent to the `ev commit --manual --change-type version_change --new-version 0.1.0-latest`
command.

   **Note:** Each additional commit (regardless of change type) won't bump the version until after a version change
   commit is made. This only applies to the initial development version.
   
6. Create a version change commit by running `ev commit` again and selecting version change. When prompted for the version,
enter **0.1.0-latest**. The default value for the version should already be populated but can still be manually entered.
The default value was derived using the same methods as the `ev calculate` command.

    **Note:** The version has to be entered manually to provide more control. In other words, the version can be
    incremented higher if necessary for a particular use case without using the calculated version. However, the
    version cannot be changed to something lower than the last recorded production version found in the most recent
    production version change commit.
    
    Also, if multiple branches are being independently versioned and contain version change commits of their own, upon
    merging back to the desired branch there may be multiple development version change commits with version numbers
    appearing out of order, albeit with a development version format - likely with different development appendages. This
    is why only the last production version change commit is used when calculating the version and all non-production
    version change commits are ignored. Because of this, it's possible to enter a development version that is higher than
    the last production version then another development version that is higher than the last production version, but
    lower than the last development version.
    
    In addition, in order to create the version change commit, a file will need to be modified so the commit will go
    through. As a best practice, modifying the file that contains the version should be done prior to making a version
    change commit. In the case of Node.js, updating the version found in the **package.json** should suffice.
    
7. Perform additional development tasks. In this example, a bug was found that has just been fixed. With the files staged,
run `ev commit` and select the bug fix change type and enter the relevant information.

8. Calculate the version again by running `ev calculate`. The output received is **0.2.0-latest**.

    **Note:** As before, regardless of the number of commits made before running the version calculation command, the
    output will always increment the minor version by one. The only way to increment the minor version further is to
    perform a version change commit then an additional versionable commit. Keep in mind this only applies to the initial
    development version.
    
9. When ready to create a production release from the initial development version, ensure the latest applicable
version change commit has been made (by selecting the **Version Change** type from the **ev commit** command). This can
be done by modifying the file containing version information and then creating a version commit with the calculated
version.

10. Switch to the production branch by running `git checkout master`. If the branch doesn't exist, use
`git checkout -b master` instead. Be sure to replace **master** with the desired production branch name.

11. If the production branch already exists, merge the changes from the development branch by running `git merge latest`.
Otherwise, if the branch was just created then it should already have the changes from the development branch.

12. Calculate the version by running the `ev calculate` command. The output should be **1.0.0**.

13. Modify the file containing the version (e.g. package.json) and update the version to **1.0.0**, the version obtained
from running the `ev calculate` command.

14. Stage the updated file by running `git add package.json`. Replace **package.json** with the applicable file.

15. Create a version commit by running the `ev commit` command and selecting **Version Change** as the change type. When
prompted, enter **1.0.0** as the version.

16. If desired, generate a changelog by running the `ev changelog` command. Be sure to stage the changelog and create a
commit using the `ev commit` command and selecting the **Changelog** change type.

    **Note:** When ready to return to active development, change to the development branch of choice and merge the changes
    from the production branch. Continue making changes and using the `ev commit` command to add them to the repository.
    Also, when ready to create a development version, run the `ev calculate` command and then create a version change
    commit by modifying the applicable file with the version information. Finally, when ready to create a production
    version, follow the same steps above starting from Step 10.

## Versioning Automation

One of the greatest benefits of using Eagle Versioner is being able to automate versioning. This is done using a
CICD pipeline which detects changes pushed to a repository and then runs the appropriate commands to generate the version
and create the associated commits or even the changelog.

The below commands are an example of the versioning automation process after changes have been detected in a branch.

```
NEW_VERSION=$(ev calculate)
npm --no-git-tag-version version $NEW_VERSION
git add package.json
ev commit --manual --change-type version_change --new-version $NEW_VERSION
ev changelog
git add CHANGELOG.md
ev commit --manual --change-type changelog --short-msg "Updated the Changelog"
```

The point in the CICD pipeline that these commands run is up to the implementor. Valid questions to ask are as follows.

1. Should the version be incremented only after pushes to the repository?

   In this scenario the development team wouldn't worry about incrementing the version before pushing to the repository,
   ideally by submitting a pull request. Therefore, when the pull request is accepted, assuming the build and tests pass,
   it will be detected that a push has occurred to the repository which will trigger the CICD pipeline. Once that occurs,
   specific logic can execute which increments the version, generates the changelog, and creates/pushes commits for both.
   
   In this situation it is important to setup logic to avoid running another build with tests since all that has changed
   is the version and changelog. However, in cases where the version is heavily coupled to application logic, pull requests
   should be submitted. Then the CICD pipeline checks out the code from the pull request and merges it with the target,
   then increments the version and creates the changelog before running the build with tests to detect any potential
   problems resulting from the version incrementation.

2. What is the recommended workflow for automatically incrementing the version?

   The below example assumes that both **pushes** and **pull requests** trigger the CICD pipeline.

   `(Developer) Change/Add Code -> (Developer) Submit Pull Request -> (CICD Pipeline) Checkout Code and Merge With Target ->
   (CICD Pipeline) Increment the Version -> (CICD Pipeline) Run Build and Tests -> (Repository Admin) Accept Pull Request ->
   (CICD Pipeline) Increment the Version, Create the Changelog, Create and Push Resulting Commits with the [ci-skip] tag,
   Deploy Application, etc. -> (CICD Pipeline) Sees the Last Commits that Were Pushed Have the [ci-skip] Tag and Should
   Be Ignored (doesn't trigger another job)`

3. When not using a CICD pipeline, how can incrementing the version be automated?

   The answer to this question is [Git Hooks](https://githooks.com/). Perhaps after merging the changes from the
   development branch to the production branch a post-merge Git Hook executes a script which runs the commands above.
   There are many possibilities depending on the desired behavior and use case.

### Docker Image Tagging

Eagle Versioner can also be used to tag a Docker image. Below is an example of how this can be achieved.

```
NEW_VERSION=$(ev calculate)
docker build -t org/dashboard:$NEW_VERSION .
```

Please [see this](https://docs.docker.com/engine/reference/commandline/build/) for more information on the Docker build
command.

### Skipping CICD Pipeline Job Trigger

As mentioned in the above recommended workflow, after a pull request is accepted it will trigger the CICD pipeline to
run again. In that scenario, the logic in the CICD pipeline will use Eagle Versioner to calculate and increment the
version and optionally create/update the changelog. When this happens it will create the necessary commits and push them.
After the commits are pushed, the CICD pipeline will run again and perform redundant tasks. This wastes resources and
isn't recommended.

To prevent this from happening, Eagle Versioner has an option to include the
[[ci-skip]](https://github.com/jenkinsci/gitlab-plugin/issues/615#issuecomment-325752912) tag. With this information a
few things are possible. For example, if using [GitLab](https://about.gitlab.com/), [Jenkins](https://jenkins.io/), and
the [GitLab plugin for Jenkins](https://github.com/jenkinsci/gitlab-plugin), there is an advanced option for the Jenkins
job configuration provided by the GitLab plugin which enables the checking of commits for the **[ci-skip]** tag. If this
tag is found, Jenkins will not run the job.

Conversely, in another example logic is included in the CICD pipeline which detects if the commits have the **[ci-skip]**
tag by getting the commit history. If the tag is found then the job can exit without performing any redundant tasks. The
only downside to this approach is that for a brief period another job has to run which will consume resources for a short
time, detect the commits aren't actionable, and exit. These jobs will also show up in the job history which may be
undesirable.

## Issues and Feature Requests

As with all software, issues can and are likely to occur. When encountering a possible bug, unexpected behavior, need
assistance, or have an idea for a potential feature, please submit an **Issue** on this repository. Issues will be
reviewed on a regular basis with a resolution being the main goal within a timely manner. However, turnaround time is
not guaranteed.

## Donations

This project is developed and maintained on the side and requires a substantial amount of time. Donations are greatly
appreciated. Please [click here](https://paypal.me/GetchaDEAGLE) to make a donation.

## Latest Changes

Please see the [changelog](documentation/CHANGELOG.md) for the latest changes.

## More from the Author

For blog posts and other interesting insights from the author, please visit [danieleagle.com](https://www.danieleagle.com).

## Copyright/License Notice

Eagle Versioner and the Eagle Versioner logo are Ⓒ Copyright 2020 Daniel Eagle. All rights reserved. Distributed under
the [MIT license](documentation/LICENSE). Please see [Third Party Notices](documentation/THIRD_PARTY_NOTICES.md) for
information on other software dependencies included as a part of Eagle Versioner.
