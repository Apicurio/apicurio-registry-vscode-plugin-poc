import React from 'react';
import { Label } from "@patternfly/react-core";

/**
 * OperationLabel component - Displays HTTP method as a colored label.
 *
 * Copied from apicurio-editors/packages/ui/src/documentDesigner/OperationLabel.tsx
 */

type OperationName = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'trace';

export function OperationLabel({ name }: { name: OperationName }) {
  switch (name) {
    case "get":
      return <Label color={"blue"}>GET</Label>;
    case "put":
      return <Label color={"teal"}>PUT</Label>;
    case "post":
      return <Label color={"green"}>POST</Label>;
    case "delete":
      return <Label color={"red"}>DELETE</Label>;
    case "head":
      return <Label color={"purple"}>HEAD</Label>;
    case "patch":
      return <Label color={"purple"}>PATCH</Label>;
    case "options":
      return <Label color={"grey"}>OPTIONS</Label>;
    case "trace":
      return <Label color={"purple"}>TRACE</Label>;
  }
}
