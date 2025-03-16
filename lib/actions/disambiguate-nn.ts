"use server"

import {createParallelAction} from "next-server-actions-parallel";
import {incrementRateCounter} from "@/lib/rate-limits";
import {EndpointName} from "@/lib/constants";
import {DisambiguateNumberSuccessResponse, InstallNestedRef, NodeRef} from "@/lib/types";

const MESHDB_ENDPOINT = "http://db.nycmesh.net/api/v1/disambiguate-number/"

// Wrapper around MeshDB's NN disambiguation endpoint (to keep the creds on the backend
// and not have to worry about CORS, etc)
// See: https://db.nycmesh.net/api-docs/swagger/#/Helpers/api_v1_disambiguate_number_retrieve
async function disambiguateNumberMeshDBInner(ambiguous_number: number): Promise<number | undefined> {
  // Throws if the rate limit is exceeded, gives the user "unknown error" which is not ideal
  // but probably fine
  await incrementRateCounter(EndpointName.MESHDB_DISAMBIGUATE);

  if (!process.env.MESHDB_TOKEN) {
    throw new Error(`MESHDB_TOKEN is missing from env vars`);
  }

  const resp = await fetch(MESHDB_ENDPOINT + "?" + new URLSearchParams({number: ambiguous_number.toString()}), {
    headers: {
      "Authorization": `Token ${process.env.MESHDB_TOKEN}`
    },
  });
  if (!resp.ok) {
    throw new Error(`Bad response from MeshDB: ${resp.status} - ${resp.statusText}`);
  }

  const result = await resp.json();
  try {
    assertDisambiguateNumberSuccessResponse(result);
  } catch (e) {
    throw new Error(`Invalid MeshDB response: ${result} ${e}`);
  }

  return result?.resolved_node?.network_number ?? undefined
}


function assertDisambiguateNumberSuccessResponse(value: unknown): asserts value is DisambiguateNumberSuccessResponse {
  if (!value || typeof value !== 'object') {
    throw new Error('Value must be an object');
  }

  const obj = value as Record<string, unknown>;

  // Check resolved_node
  if (obj.resolved_node) {
    if (typeof obj.resolved_node !== 'object') {
      throw new Error('resolved_node must be an object');
    }

    const resolvedNode = obj.resolved_node as Record<string, unknown>;

    if (typeof resolvedNode.id !== 'string') {
      throw new Error('resolved_node.id must be a string');
    }

    if (resolvedNode.network_number !== null && typeof resolvedNode.network_number !== 'number') {
      throw new Error('resolved_node.network_number must be a number or null');
    }
  }

  // Check supporting_data
  if (!obj.supporting_data || typeof obj.supporting_data !== 'object') {
    throw new Error('supporting_data must be an object');
  }

  const supportingData = obj.supporting_data as Record<string, unknown>;

  // Check exact_match_install
  if (supportingData.exact_match_install) {
    assertInstallNestedRef(supportingData.exact_match_install, 'exact_match_install');
  }

  // Check exact_match_recycled_install
  if (supportingData.exact_match_recycled_install) {
    assertInstallNestedRef(supportingData.exact_match_recycled_install, 'exact_match_recycled_install');
  }

  // Check exact_match_node
  if (supportingData.exact_match_node) {
    assertNodeRef(supportingData.exact_match_node, 'exact_match_node');
  }
}

function assertNodeRef(value: unknown, path: string): asserts value is NodeRef {
  if (!value || typeof value !== 'object') {
    throw new Error(`${path} must be an object`);
  }

  const node = value as Record<string, unknown>;

  if (typeof node.id !== 'string') {
    throw new Error(`${path}.id must be a string`);
  }

  if (node.network_number !== null && typeof node.network_number !== 'number') {
    throw new Error(`${path}.network_number must be a number or null`);
  }
}

function assertInstallNestedRef(value: unknown, path: string): asserts value is InstallNestedRef {
  if (!value || typeof value !== 'object') {
    throw new Error(`${path} must be an object`);
  }

  const install = value as Record<string, unknown>;

  if (typeof install.id !== 'string') {
    throw new Error(`${path}.id must be a string`);
  }

  if (typeof install.install_number !== 'number') {
    throw new Error(`${path}.install_number must be a number`);
  }

  if (install.node !== null) {
    assertNodeRef(install.node, `${path}.node`);
  }
}


export const disambiguateNumberMeshDB = createParallelAction(disambiguateNumberMeshDBInner);
