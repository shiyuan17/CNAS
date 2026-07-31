// 浮层工厂：Modal / Form / Drawer
// 复用 mvp_design 的闭包回调模式，通过根节点上的 _onConfirm/_onSubmit 解耦。

import { $, icon, escapeHtml, refreshIcons } from './components.js';

// Toast 提示
export function toast(title, message, type = 'success') {
  const icons = { success: 'check-circle', danger: 'x-circle', warning: 'alert-triangle', info: 'info' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(icons[type] || 'info')}<div class="toast-body"><div class="toast-title">${escapeHtml(title)}</div>${message ? `<div class="toast-msg">${escapeHtml(message)}</div>` : ''}</div>`;
  $('#toast-region').appendChild(el);
  refreshIcons();
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// 确认弹窗
export function openModal(title, message, confirmLabel, onConfirm, danger = false) {
  closeModal();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal ${danger ? 'danger' : ''}">
      <div class="modal-header">${escapeHtml(title)}</div>
      <div class="modal-body">${typeof message === 'string' ? escapeHtml(message) : message}</div>
      <div class="modal-footer">
        <button class="button secondary" data-overlay="cancel">取消</button>
        <button class="button ${danger ? 'danger' : 'primary'}" data-overlay="confirm">${escapeHtml(confirmLabel)}</button>
      </div>
    </div>`;
  $('#modal-root').appendChild(backdrop);
  backdrop._onConfirm = onConfirm;
  refreshIcons();

  backdrop.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-overlay]');
    if (btn) {
      if (btn.dataset.overlay === 'confirm' && backdrop._onConfirm) backdrop._onConfirm();
      closeModal();
    } else if (e.target === backdrop) {
      closeModal();
    }
  });
}

// 表单弹窗
export function openForm(title, description, fields, onSubmit, options = {}) {
  closeModal();
  const fieldHtml = fields.map((f) => {
    const required = f.required ? '<span class="required">*</span>' : '';
    if (f.enum) {
      const opts = f.enum.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
      return `<div class="form-field"><label>${escapeHtml(f.label)} ${required}</label><select data-form-field="${escapeHtml(f.key)}"><option value="">请选择</option>${opts}</select></div>`;
    }
    if (f.type === 'textarea') {
      return `<div class="form-field"><label>${escapeHtml(f.label)} ${required}</label><textarea data-form-field="${escapeHtml(f.key)}" placeholder="${escapeHtml(f.placeholder || '')}">${escapeHtml(f.value || '')}</textarea>${f.hint ? `<div class="field-hint">${escapeHtml(f.hint)}</div>` : ''}</div>`;
    }
    return `<div class="form-field"><label>${escapeHtml(f.label)} ${required}</label><input type="text" data-form-field="${escapeHtml(f.key)}" value="${escapeHtml(f.value || '')}" placeholder="${escapeHtml(f.placeholder || '')}"/>${f.hint ? `<div class="field-hint">${escapeHtml(f.hint)}</div>` : ''}</div>`;
  }).join('');

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-header">${escapeHtml(title)}</div>
      <div class="modal-body">${description ? `<p style="margin:0 0 16px;color:var(--muted);">${escapeHtml(description)}</p>` : ''}${fieldHtml}</div>
      <div class="modal-footer">
        <button class="button secondary" data-overlay="cancel">取消</button>
        <button class="button primary" data-overlay="submit">${escapeHtml(options.submitLabel || '保存')}</button>
      </div>
    </div>`;
  $('#modal-root').appendChild(backdrop);
  backdrop._onSubmit = onSubmit;
  refreshIcons();

  backdrop.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-overlay]');
    if (btn) {
      if (btn.dataset.overlay === 'submit') {
        const values = {};
        backdrop.querySelectorAll('[data-form-field]').forEach((field) => {
          values[field.dataset.formField] = field.value.trim();
        });
        closeModal();
        if (backdrop._onSubmit) backdrop._onSubmit(values);
      } else {
        closeModal();
      }
    } else if (e.target === backdrop) {
      closeModal();
    }
  });
}

// 关闭弹窗
export function closeModal() {
  $('#modal-root').innerHTML = '';
}

// 抽屉
export function openDrawer(title, bodyHtml, footerHtml = '') {
  closeDrawer();
  const backdrop = document.createElement('div');
  backdrop.className = 'drawer-backdrop';
  backdrop.addEventListener('click', closeDrawer);

  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.innerHTML = `
    <div class="drawer-header"><h2>${escapeHtml(title)}</h2><button class="drawer-close" data-overlay="close">${icon('x')}</button></div>
    <div class="drawer-body">${bodyHtml}</div>
    ${footerHtml ? `<div class="drawer-footer">${footerHtml}</div>` : ''}`;
  $('#drawer-root').appendChild(backdrop);
  $('#drawer-root').appendChild(drawer);
  refreshIcons();

  drawer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-overlay]');
    if (btn && btn.dataset.overlay === 'close') closeDrawer();
  });
  drawer.querySelector('.drawer-close')?.addEventListener('click', closeDrawer);
}

// 关闭抽屉
export function closeDrawer() {
  $('#drawer-root').innerHTML = '';
}
