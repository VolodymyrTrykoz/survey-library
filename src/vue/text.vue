<template>
  <div>
    <input
      :disabled="question.isReadOnly"
      :class="question.cssClasses.root"
      :type="question.inputType"
      :maxlength="question.getMaxLength()"
      :min="question.renderedMin"
      :max="question.renderedMax"
      :step="question.renderedStep"
      :size="question.size"
      :id="question.inputId"
      :list="question.dataListId"
      :placeholder="
        question.inputType === 'range' || question.isReadOnly
          ? ''
          : question.placeHolder
      "
      :autocomplete="question.autoComplete"
      :value="question.value"
      @change="change"
      @keyup="keyup"
      v-bind:aria-required="question.isRequired"
      v-bind:aria-label="question.locTitle.renderedHtml"
      :aria-invalid="question.errors.length > 0"
      :aria-describedby="
        question.errors.length > 0 ? question.id + '_errors' : null
      "
    />
    <datalist v-if="question.dataListId" :id="question.dataListId">
      <option v-for="item in question.dataList" :value="item"></option>
    </datalist>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { default as QuestionVue } from "./question";
import { QuestionTextModel } from "survey-core";

@Component
export class Text extends QuestionVue<QuestionTextModel> {
  change(event: any) {
    this.question.value = event.target.value;
  }
  keyup(event: any) {
    if (!this.question.isInputTextUpdate) return;
    this.question.value = event.target.value;
  }
}
Vue.component("survey-text", Text);
export default Text;
</script>
