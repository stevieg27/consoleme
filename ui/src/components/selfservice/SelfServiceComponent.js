import _ from "lodash";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button, Form, Header, Message } from "semantic-ui-react";
import DropDownBlockComponent from "../blocks/DropDownBlockComponent";
import TextInputBlockComponent from "../blocks/TextInputBlockComponent";
import TypeaheadBlockComponent from "../blocks/TypeaheadBlockComponent";

const SelfServiceComponent = (props) => {
  const initialState = {
    messages: [],
    values: {},
  };
  const [state, setState] = useState(initialState);

  const handleInputUpdate = (context, value) => {
    const { values } = state;
    const newValues = {
      ...values,
      [context]: _.isString(value) ? value.trim() : value,
    };
    setState({
      ...state,
      values: newValues,
    });
  };

  const handleSubmit = () => {
    const { config, role, service } = props;
    const { values } = state;
    const { inputs, condition } = config.permissions_map[service];

    const default_values = { condition };

    inputs.forEach((input) => {
      default_values[input.name] = input.default || null;
    });

    const result = Object.assign(default_values, values);
    Object.keys(result).forEach((key) => {
      const value = result[key];
      if (value && !["actions", "condition"].includes(key)) {
        result[key] = value.replace("{account_id}", role.account_id);
      }
    });

    // Exception Hanlding for inputs
    const messages = [];
    Object.keys(inputs).forEach((idx) => {
      const input = inputs[idx];
      if (!result[input.name]) {
        messages.push(`No value is given for ${input.name}`);
      }
    });

    if (!("actions" in result)) {
      messages.push("No actions are selected");
    }

    if (messages.length > 0) {
      return setState({ ...state, messages });
    }

    const permission = {
      service,
      ...result,
    };
    setState(initialState);
    props.updatePermission(permission);
  };

  const buildInputBlocks = () => {
    const { config, service, role } = props;
    const { action_map, inputs } = config.permissions_map[service];
    const options = action_map.map((action) => ({
      key: action.name,
      text: action.text,
      value: action.name,
      actions: action.permissions,
    }));

    const blocks = inputs.map((input) => {
      // TODO(heewonk), make this substitution logic uniform and applied once
      let defaultValue;
      defaultValue = input.default || "";
      defaultValue = defaultValue.replace("{account_id}", role.account_id);
      switch (input.type) {
        case "text_input":
          return (
            <TextInputBlockComponent
              defaultValue={defaultValue}
              handleInputUpdate={() => handleInputUpdate(this, input.name)}
              required={input.required || false}
              label={input.text}
            />
          );
        case "typeahead_input":
          return (
            <TypeaheadBlockComponent
              defaultValue={defaultValue}
              handleInputUpdate={() => handleInputUpdate(this, input.name)}
              required={input.required || false}
              typeahead={input.typeahead_endpoint}
              label={input.text}
            />
          );
        default:
          return <div />;
      }
    });

    // DropDown Blocks for gathering Permission Actions for this Service.
    blocks.push(
      <DropDownBlockComponent
        handleInputUpdate={() => handleInputUpdate(this, "actions")}
        options={options}
        required
      />
    );

    return blocks;
  };

  const { config, service } = props;
  const { description, text } = config.permissions_map[service];

  const { messages } = state;
  const messagesToShow =
    messages.length > 0 ? (
      <Message negative>
        <Message.Header>There are some parameters missing.</Message.Header>
        <Message.List>
          {messages.map((message) => (
            <Message.Item>{message}</Message.Item>
          ))}
        </Message.List>
      </Message>
    ) : null;

  const blocks = buildInputBlocks();

  return (
    <Form>
      <Header as="h3">{text}</Header>
      <ReactMarkdown linkTarget="_blank" source={description} />
      {blocks}
      {messagesToShow}
      <Button fluid onClick={() => handleSubmit()} primary type="submit">
        Add Permission
      </Button>
    </Form>
  );
};

export default SelfServiceComponent;
