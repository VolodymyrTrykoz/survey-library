<template>
  <ul
    class="sv-list"
    @mousedown="
      (data, e) => {
        e.preventDefault();
      }
    "
  >
    <li
      class="sv-list__item"
      v-for="item in model.items"
      :key="item.id"
      v-bind:class="model.getItemClass(item)"
      v-on:click="model.selectItem(item)"
    >
      <sv-svg-icon
        v-if="item.iconName"
        class="sv-list__item-icon"
        :iconName="item.iconName"
        :size="24"
      ></sv-svg-icon>
      <span>{{ item.title }}</span>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ListModel } from "survey-core";
import { BaseVue } from "../../base";

@Component
export class List extends BaseVue {
  @Prop
  public model: ListModel;

  constructor() {
    super();
  }

  getModel() {
    return this.model;
  }
}

Vue.component("sv-list", List);
export default List;
</script>
