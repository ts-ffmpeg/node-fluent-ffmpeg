#!/usr/bin/env bash

set -euo pipefail

# Usage:
#   bash scripts/test-node-matrix.sh
#   NODE_MATRIX_VERSIONS="22 24" bash scripts/test-node-matrix.sh
#   NODE_MATRIX_USE_DOCKER=1 bash scripts/test-node-matrix.sh
#   NODE_MATRIX_TEST_COMMAND="mocha --reporter dot e2e/features.test.js" bash scripts/test-node-matrix.sh

REPOSITORY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PNPM_10_VERSION="10.34.4"
PNPM_11_VERSION="11.9.0"
NODE_MATRIX_VERSIONS="${NODE_MATRIX_VERSIONS:-18 20 22 24}"
NODE_MATRIX_USE_DOCKER="${NODE_MATRIX_USE_DOCKER:-0}"
NODE_MATRIX_CACHE_DIR="${NODE_MATRIX_CACHE_DIR:-${REPOSITORY_ROOT}/.cache/node-matrix}"
NODE_MATRIX_TEST_COMMAND="${NODE_MATRIX_TEST_COMMAND:-npm run build --if-present && nyc mocha --require should --reporter spec && mocha --require should --reporter spec --timeout 30000 e2e/features.test.js}"
NODE_MATRIX_INSTALL_ONLY="${NODE_MATRIX_INSTALL_ONLY:-0}"
NODE_MATRIX_DOCKER_PLATFORM="${NODE_MATRIX_DOCKER_PLATFORM:-}"
NODE_MATRIX_FFMPEG_BIN="${NODE_MATRIX_FFMPEG_BIN:-}"

if [[ "${1:-}" == "--help" ]]; then
  sed -n '4,8p' "$0"
  cat <<'EOF'

Environment variables:
  NODE_MATRIX_VERSIONS          Space-separated Node.js major versions.
  NODE_MATRIX_USE_DOCKER        Set to 1 to use Docker instead of local nvm.
  NODE_MATRIX_CACHE_DIR         Cache root for per-version projects and pnpm store.
  NODE_MATRIX_TEST_COMMAND      Command executed once for every Node.js version.
  NODE_MATRIX_INSTALL_ONLY      Set to 1 to populate caches without running tests.
  NODE_MATRIX_DOCKER_PLATFORM   Optional Docker platform, for example linux/amd64.
  NODE_MATRIX_FFMPEG_BIN        Local directory containing ffmpeg and ffprobe.
EOF
  exit 0
fi

log() {
  printf '\n==> %s\n' "$*"
}

pnpm_version_for_node() {
  local node_version="$1"
  local node_major="${node_version%%.*}"

  if ! [[ "${node_major}" =~ ^[0-9]+$ ]]; then
    echo "NODE_MATRIX_VERSIONS must contain numeric Node.js versions, got: ${node_version}" >&2
    exit 1
  fi

  if (( node_major < 22 )); then
    printf '%s\n' "${PNPM_10_VERSION}"
  else
    printf '%s\n' "${PNPM_11_VERSION}"
  fi
}

docker_platform_args() {
  if [[ -n "${NODE_MATRIX_DOCKER_PLATFORM}" ]]; then
    printf '%s\n' "--platform" "${NODE_MATRIX_DOCKER_PLATFORM}"
  fi
}

run_local_matrix() {
  export NVM_DIR="${NVM_DIR:-${HOME}/.nvm}"

  if [[ ! -s "${NVM_DIR}/nvm.sh" ]]; then
    echo "nvm was not found at ${NVM_DIR}/nvm.sh" >&2
    echo "Install nvm or set NODE_MATRIX_USE_DOCKER=1." >&2
    exit 1
  fi

  # shellcheck source=/dev/null
  source "${NVM_DIR}/nvm.sh"

  local ffmpeg_bin="${NODE_MATRIX_FFMPEG_BIN}"
  if [[ -z "${ffmpeg_bin}" ]] && command -v ffmpeg >/dev/null 2>&1; then
    ffmpeg_bin="$(dirname "$(command -v ffmpeg)")"
  elif [[ -z "${ffmpeg_bin}" ]] && [[ -x /opt/homebrew/bin/ffmpeg ]]; then
    ffmpeg_bin="/opt/homebrew/bin"
  elif [[ -z "${ffmpeg_bin}" ]] && [[ -x /usr/local/bin/ffmpeg ]]; then
    ffmpeg_bin="/usr/local/bin"
  fi

  if [[ "${NODE_MATRIX_INSTALL_ONLY}" != "1" ]] && [[ -z "${ffmpeg_bin}" ]]; then
    echo "ffmpeg was not found in PATH or a common local installation directory." >&2
    echo "Install FFmpeg or set NODE_MATRIX_FFMPEG_BIN to its bin directory." >&2
    exit 1
  fi

  for version in ${NODE_MATRIX_VERSIONS}; do
    local pnpm_version
    pnpm_version="$(pnpm_version_for_node "${version}")"
    local dependency_dir="${NODE_MATRIX_CACHE_DIR}/local/node-v${version}/project"
    local modules_dir="${dependency_dir}/node_modules"
    local store_dir="${NODE_MATRIX_CACHE_DIR}/local/node-v${version}/pnpm-store-v${pnpm_version}"

    mkdir -p "${dependency_dir}" "${store_dir}"
    cp package.json pnpm-lock.yaml "${dependency_dir}/"

    log "Installing Node.js ${version} with nvm"
    nvm install "${version}"

    log "Installing dependencies with Node.js ${version} and pnpm ${pnpm_version}"
    nvm exec "${version}" env CI=true \
      corepack pnpm@"${pnpm_version}" --dir "${dependency_dir}" install \
      --frozen-lockfile \
      --store-dir "${store_dir}"

    if [[ "${NODE_MATRIX_INSTALL_ONLY}" == "1" ]]; then
      continue
    fi

    log "Testing with Node.js ${version}"
    nvm exec "${version}" env \
      NODE_ENV=test \
      NODE_PATH="${modules_dir}" \
      PATH="${modules_dir}/.bin:${ffmpeg_bin}:${PATH}" \
      bash -c "${NODE_MATRIX_TEST_COMMAND}"
  done
}

run_docker_matrix() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "docker was not found in PATH." >&2
    exit 1
  fi

  local docker_cache_dir="${NODE_MATRIX_CACHE_DIR}/docker"
  local platform_args=()

  while IFS= read -r argument; do
    platform_args+=("${argument}")
  done < <(docker_platform_args)

  mkdir -p "${docker_cache_dir}"

  for version in ${NODE_MATRIX_VERSIONS}; do
    local pnpm_version
    pnpm_version="$(pnpm_version_for_node "${version}")"
    local dependency_dir="/cache/node-v${version}/project"
    local modules_dir="${dependency_dir}/node_modules"
    local store_dir="/cache/node-v${version}/pnpm-store-v${pnpm_version}"

    log "Installing dependencies with Node.js ${version} and pnpm ${pnpm_version} in Docker"
    docker run --rm \
      "${platform_args[@]}" \
      --volume "${REPOSITORY_ROOT}:/workspace" \
      --volume "${docker_cache_dir}:/cache" \
      --workdir /workspace \
      --env CI=true \
      "node:${version}-bookworm" \
      bash -c "mkdir -p ${dependency_dir} ${store_dir} && cp package.json pnpm-lock.yaml ${dependency_dir}/ && corepack pnpm@${pnpm_version} --dir ${dependency_dir} install --frozen-lockfile --store-dir ${store_dir}"

    if [[ "${NODE_MATRIX_INSTALL_ONLY}" == "1" ]]; then
      continue
    fi

    log "Testing with Node.js ${version} and FFmpeg in Docker"
    docker run --rm \
      "${platform_args[@]}" \
      --volume "${REPOSITORY_ROOT}:/workspace" \
      --volume "${docker_cache_dir}:/cache" \
      --workdir /workspace \
      --env NODE_ENV=test \
      --env NODE_PATH="${modules_dir}" \
      "node:${version}-bookworm" \
      bash -c "apt-get update >/dev/null && apt-get install -y --no-install-recommends ffmpeg >/dev/null && export PATH=${modules_dir}/.bin:\${PATH} && ${NODE_MATRIX_TEST_COMMAND}"
  done
}

cd "${REPOSITORY_ROOT}"
mkdir -p "${NODE_MATRIX_CACHE_DIR}"

if [[ "${NODE_MATRIX_USE_DOCKER}" == "1" ]]; then
  run_docker_matrix
else
  run_local_matrix
fi
