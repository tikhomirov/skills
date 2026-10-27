.DEFAULT_GOAL := help
.PHONY: help test check install-local install-global

help: ## Show developer commands
	@printf 'Commands:\n  make test            Run all tests\n  make check           Check JavaScript syntax\n  make install-local   Install skills in this repository\n  make install-global  Install skills for all projects\n\nCLI:\n  ./bin/skills-install --help\n  ./bin/obsidian-project-framework --help\n'

test: ## Run all tests
	npm test

check: ## Check JavaScript syntax
	npm run check

install-local: ## Install skills in this repository
	./bin/skills-install

install-global: ## Install skills globally
	./bin/skills-install --global
